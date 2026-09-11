/*
 * CO2 LASER SERVICES — carte du rayon d'intervention (Leaflet).
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  POUR MODIFIER LES POINTS : éditez POINTS ci-dessous. `lat`/`lon` sont
 *  les coordonnées réelles ; Leaflet se charge du placement. Les textes
 *  vivent dans assets/js/content.js (clés m.field.zNn/zNr/zNd).
 *
 *  Fond de carte : tuiles OpenStreetMap standard, assombries en CSS (voir
 *  moderne.css, .carte .leaflet-tile-pane). Ce sont de vraies tuiles
 *  chargées depuis Internet : la carte ne fonctionne donc qu'en ligne,
 *  comme n'importe quelle carte Leaflet/Google Maps embarquée — c'est
 *  attendu, pas une régression.
 *
 *  Pourquoi pas CARTO « Dark Matter », utilisé au départ : CARTO a fermé
 *  l'accès anonyme à ses fonds de carte. Le serveur répond toujours 200,
 *  mais renvoie des tuiles tamponnées « API KEY REQUIRED » en filigrane.
 *  OpenStreetMap ne demande aucune clé ; son style est clair, d'où
 *  l'inversion CSS pour retomber dans la charte très sombre.
 *
 *  ATTENTION MISE EN PRODUCTION : la politique d'usage des tuiles
 *  openstreetmap.org vise les usages modestes (site vitrine : OK). Pour un
 *  trafic réel, prendre un fournisseur avec clé et palier gratuit — Stadia
 *  Maps « Alidade Smooth Dark », MapTiler « Dark Matter » ou CARTO avec
 *  compte — et retirer le filtre CSS puisque ces fonds sont déjà sombres.
 *  Le changement se limite à l'appel L.tileLayer ci-dessous.
 *
 *  Le survol/zoom est bloqué au cadre France–Allemagne–Royaume-Uni : on
 *  peut zoomer vers l'intérieur, jamais dézoomer au-delà de ce cadre.
 * ─────────────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  var conteneur = document.getElementById('carte-leaflet');
  if (!conteneur || typeof L === 'undefined') return;

  var POINTS = [
    { k: 'z1',  lat: 48.72, lon: 7.10, base: true }, // Troisfontaines
    { k: 'z2',  lat: 48.83, lon: 9.07 },             // Ditzingen (TRUMPF)
    { k: 'z3',  lat: 48.58, lon: 7.75 },             // Strasbourg
    { k: 'z4',  lat: 49.61, lon: 6.13 },             // Luxembourg
    { k: 'z5',  lat: 48.14, lon: 11.57 },            // Munich
    { k: 'z6',  lat: 50.11, lon: 8.68 },             // Francfort
    { k: 'z7',  lat: 50.85, lon: 4.35 },             // Bruxelles
    { k: 'z8',  lat: 47.37, lon: 8.54 },             // Zurich
    { k: 'z9',  lat: 45.76, lon: 4.84 },             // Lyon
    { k: 'z10', lat: 48.86, lon: 2.35 }              // Paris
  ];

  var CENTRE = [48.72, 7.10];       // Troisfontaines
  var ZOOM_INITIAL = 6.4;
  var ZOOM_MAX = 13;
  // Enveloppe France + Allemagne + Royaume-Uni (avec une marge de confort) :
  // borne le dézoom, pas le zoom vers l'intérieur.
  var CADRE = L.latLngBounds([40.8, -9.2], [61.4, 15.6]);

  var map = L.map(conteneur, {
    center: CENTRE,
    zoom: ZOOM_INITIAL,
    maxZoom: ZOOM_MAX,
    maxBounds: CADRE.pad(0.06),
    maxBoundsViscosity: 1,
    zoomSnap: 0.1,
    attributionControl: true
  });

  // ─── Point de bascule du fond de carte : une seule ligne à changer ───
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    // Attribution obligatoire (licence ODbL) : ne pas retirer.
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  window.CO2LS = window.CO2LS || {};
  window.CO2LS.map = map; // utile pour un futur réglage fin depuis la console

  // Le dézoom maximal dépend de la taille réelle du conteneur : on calcule
  // le niveau exact où CADRE remplit la carte, plutôt qu'un chiffre fixe
  // qui serait faux selon la largeur d'écran.
  function figerLimiteDezoom() {
    var z = map.getBoundsZoom(CADRE, false);
    map.setMinZoom(z);
    if (map.getZoom() < z) map.setZoom(z);
  }
  figerLimiteDezoom();
  window.addEventListener('resize', debounce(function () {
    map.invalidateSize();
    figerLimiteDezoom();
  }, 200));

  function debounce(fn, ms) {
    var h;
    return function () { clearTimeout(h); h = setTimeout(fn, ms); };
  }

  /* ------------------------------------------------ marqueurs */
  var t = window.CO2LS.i18n.t;
  var panneau = document.getElementById('carte-info');
  var champRegion = panneau.querySelector('.carte-card-r');
  var champNom = panneau.querySelector('.carte-card-n');
  var champTexte = panneau.querySelector('.carte-card-d');
  var courant = 'z1';
  var marqueurs = {};

  function icone(p) {
    return L.divIcon({
      className: 'c-point-wrap' + (p.base ? ' is-base' : ''),
      html: '<span class="c-pastille"></span><span class="c-nom">' +
        t('m.field.' + p.k + 'n') + '</span>',
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  }

  function afficher(k) {
    courant = k;
    champRegion.textContent = t('m.field.' + k + 'r');
    champNom.textContent = t('m.field.' + k + 'n');
    champTexte.textContent = t('m.field.' + k + 'd');
    panneau.classList.add('is-filled');

    Object.keys(marqueurs).forEach(function (mk) {
      var el = marqueurs[mk].getElement();
      if (el) el.classList.toggle('is-on', mk === k);
    });
  }

  function poserMarqueurs() {
    POINTS.forEach(function (p) {
      var m = L.marker([p.lat, p.lon], { icon: icone(p), keyboard: true, alt: t('m.field.' + p.k + 'n') })
        .addTo(map);
      m.on('mouseover click focus', function () { afficher(p.k); });
      marqueurs[p.k] = m;
    });
    afficher(courant);
  }
  poserMarqueurs();

  // Changement de langue : reconstruire les icônes (le nom est gravé dans
  // le HTML du divIcon, pas piloté par data-i18n) et retraduire la fiche.
  document.addEventListener('i18n:changed', function () {
    Object.keys(marqueurs).forEach(function (k) { map.removeLayer(marqueurs[k]); });
    marqueurs = {};
    poserMarqueurs();
  });

  /* ------------------------------------------------ invite tactile */
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var invite = document.querySelector('.carte-hint');
    if (invite) invite.setAttribute('data-i18n', 'm.field.hintTouch');
    window.CO2LS.i18n.apply(invite ? invite.parentElement : document);
  }

  // La carte est prête avant que la section n'ait fini son fondu d'entrée ;
  // un recalcul de taille une fois la transition CSS terminée évite toute
  // tuile mal alignée si le conteneur a changé de taille pendant le fondu.
  var carteBox = conteneur.closest('.carte');
  if (carteBox) {
    carteBox.addEventListener('transitionend', function () { map.invalidateSize(); }, { once: true });
  }
  window.addEventListener('load', function () { map.invalidateSize(); figerLimiteDezoom(); });
})();
