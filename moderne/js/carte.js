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
    { k: 'z10', lat: 48.86, lon: 2.35 },             // Paris

    // Couverture nationale. Ces repères n'ont volontairement PAS de fiche
    // détaillée : seuls leur nom et leur région s'affichent, faute de texte
    // fourni. Leur pastille est plus discrète, pour qu'on les lise comme des
    // repères de couverture et non comme des points documentés.
    { k: 'z11', lat: 48.2973, lon: 4.0744, repere: true },  // Troyes
    { k: 'z12', lat: 47.9029, lon: 1.9093, repere: true },  // Orléans
    { k: 'z13', lat: 49.2583, lon: 4.0317, repere: true },  // Reims
    { k: 'z14', lat: 45.8336, lon: 1.2611, repere: true },  // Limoges
    { k: 'z15', lat: 47.0225, lon: 4.8372, repere: true },  // Beaune
    { k: 'z16', lat: 47.2378, lon: 6.0241, repere: true },  // Besançon
    { k: 'z17', lat: 44.9333, lon: 4.8924, repere: true },  // Valence
    { k: 'z18', lat: 45.7772, lon: 3.0870, repere: true },  // Clermont-Ferrand
    { k: 'z19', lat: 49.4432, lon: 1.0999, repere: true },  // Rouen
    { k: 'z20', lat: 50.6292, lon: 3.0573, repere: true }   // Lille
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
    attributionControl: true,
    // Une carte posée au milieu d'une page longue ne doit jamais capturer le
    // geste de défilement. Sans ça, la molette dézoome la carte au lieu de
    // faire défiler la page, et un doigt posé sur la carte déplace la carte
    // au lieu de faire défiler. Le zoom reste accessible par les boutons
    // + et -, par double-clic, et à deux doigts sur écran tactile.
    scrollWheelZoom: false
  });

  /* ---------------- gestes tactiles : deux doigts obligatoires -------------
     Sur écran tactile, le déplacement à un doigt est désactivé : un doigt
     fait défiler la page, deux doigts pilotent la carte (le gestionnaire de
     pincement de Leaflet assure à la fois le zoom ET le déplacement). Un
     message apparaît brièvement si l'utilisateur essaie à un seul doigt,
     sinon la carte semble simplement bloquée. */
  var tactile = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (tactile) {
    map.dragging.disable();

    var voile = document.createElement('div');
    voile.className = 'carte-geste';
    voile.setAttribute('aria-hidden', 'true');
    voile.setAttribute('data-i18n', 'm.field.twoFingers');
    conteneur.parentNode.appendChild(voile);

    var minuteurVoile = null;
    conteneur.addEventListener('touchmove', function (ev) {
      if (ev.touches.length !== 1) return;
      voile.classList.add('is-shown');
      clearTimeout(minuteurVoile);
      minuteurVoile = setTimeout(function () { voile.classList.remove('is-shown'); }, 1400);
    }, { passive: true });
  }

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

  // Cadrage d'ouverture : on englobe TOUS les points plutôt que de centrer sur
  // Troisfontaines à un zoom fixe. Avec les repères nationaux, un cadrage fixe
  // coupait le sud de la France, ce qui reproduisait l'effet « uniquement à
  // l'Est » qu'on cherchait justement à corriger. Calculé à partir des points
  // eux-mêmes, le cadrage reste juste si on en ajoute ou en retire.
  var ENVELOPPE = L.latLngBounds(POINTS.map(function (p) { return [p.lat, p.lon]; }));
  function cadrer() {
    map.fitBounds(ENVELOPPE, { padding: [34, 34], animate: false });
  }

  figerLimiteDezoom();
  cadrer();
  window.addEventListener('resize', debounce(function () {
    map.invalidateSize();
    figerLimiteDezoom();
    cadrer();
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
      className: 'c-point-wrap' + (p.base ? ' is-base' : '') + (p.repere ? ' is-repere' : ''),
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
    // Les repères de couverture nationale n'ont pas de description : t()
    // renvoie une chaîne vide, et on masque le paragraphe plutôt que de
    // laisser un blanc qui ferait croire à un texte qui n'a pas chargé.
    var texte = t('m.field.' + k + 'd');
    champTexte.textContent = texte;
    champTexte.hidden = !texte;
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
  window.addEventListener('load', function () { map.invalidateSize(); figerLimiteDezoom(); cadrer(); });
})();
