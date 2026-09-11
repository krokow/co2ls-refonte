# CO2 LASER SERVICES — refonte du site

Deux propositions de refonte, hébergées côte à côte sur GitHub Pages.

| | Adresse | Ce que c'est |
|---|---|---|
| Accueil | `/` | Page de choix entre les deux propositions |
| Proposition 1 | `/classique/` | Le site actuel à l'identique sur ordinateur + une version mobile complète |
| Proposition 2 | `/moderne/` | Page unique à ancres, même charte, plus démonstrative |

## Ce qui a été fait

**Version classique** — Au-dessus de 1024 px, le rendu reprend la grille 980 px
d'origine, les sprites de boutons-triangles, les positions absolues et les
images du site existant : à l'écran, rien ne bouge. En dessous de 1024 px, tout
le gabarit est réécrit (barre supérieure, navigation basse reprenant les mêmes
triangles, contenu en cartes). L'ancien site masquait purement et simplement son
contenu sur téléphone et affichait une image « tournez votre écran ».

**Version moderne** — Une seule page, navigation par ancres, en-tête qui se
condense au défilement. Halo conique et faisceau de découpe animés dans le
héros, révélations progressives, frise de méthode qui se trace, projecteur
suivant le curseur sur les cartes. Cinq sections nouvelles par rapport au site
actuel : chiffres clés, signature « 10,6 µm », méthode d'intervention, machines
couvertes et carte du rayon d'intervention.

La carte du rayon d'intervention est une vraie carte Leaflet, pas un schéma :
on peut y zoomer, et le dézoom est bloqué au cadre France–Allemagne–Royaume-Uni
(calculé dynamiquement via `map.getBoundsZoom()`, donc toujours juste quelle que
soit la largeur d'écran). Leaflet est fourni en local dans
`assets/vendor/leaflet/` (licence BSD-2-Clause, voir le fichier `LICENSE` à
côté) : pas de CDN pour le moteur de la carte. **Les tuiles de fond, elles, sont
chargées en ligne depuis OpenStreetMap** — c'est le cas de toute carte Leaflet
ou Google Maps embarquée, la carte a donc besoin d'une connexion Internet pour
afficher son fond (les marqueurs et l'interaction fonctionnent quoi qu'il
arrive).

Le style clair d'OpenStreetMap est ramené dans la charte très sombre par un
filtre CSS appliqué au seul calque des tuiles (`.carte .leaflet-tile-pane`,
variable `--tuiles-filtre` dans `moderne/css/moderne.css`) : marqueurs, noms de
villes et contrôles de zoom gardent leurs couleurs. Le fond CARTO « Dark
Matter » utilisé au départ a été abandonné : CARTO a fermé l'accès anonyme et
renvoie désormais des tuiles tamponnées « API KEY REQUIRED » en filigrane, avec
un code HTTP 200 qui ne signale rien côté client.

Chaque point de `moderne/js/carte.js` (tableau `POINTS`) est décrit par ses
coordonnées géographiques réelles ; les textes associés vivent dans
`assets/js/content.js` (clés `m.field.z*`) et décrivent des zones couvertes,
pas des chantiers datés — à remplacer par de vraies références si le client
souhaite en afficher.

La section « machines couvertes » est une vitrine à défilement automatique
(`moderne/js/machines.js`) : une grande carte « en scène » avec la machine
active, les trois autres empilées à côté (légèrement inclinées, comme une
pile de fiches) — cliquer une carte de la pile la fait passer en scène.
Avance automatique toutes les 4,8 s, pilotable au clic ou au clavier, en
pause au survol/focus. Respecte `prefers-reduced-motion` (pas d'avance
automatique).

**Les deux** — Textes réécrits et corrigés, site réellement trilingue FR / DE /
EN, aucune dépendance externe (ni Google Fonts, ni CDN), `prefers-reduced-motion`
respecté.

## Organisation

```
assets/
  js/content.js     tous les textes, dans les trois langues — source unique
  js/i18n.js        moteur de traduction (data-i18n, mémorisation du choix)
  img/  font/       reprises telles quelles du site existant
  vendor/leaflet/   bibliothèque Leaflet, hébergée en local (licence BSD-2-Clause)
classique/          proposition 1 — 7 pages
moderne/            proposition 2 — page unique + mentions légales
old-co2ls/          extraction du site existant, conservée pour référence
```

Pour modifier un texte, un seul fichier : `assets/js/content.js`. La clé est
partagée par les deux versions.

## Aperçu en local

```bash
python3 -m http.server 8000
# http://localhost:8000/
```

## Points à traiter avant une mise en production

- **Les formulaires de contact ne sont pas fonctionnels.** GitHub Pages est un
  hébergement statique : il n'exécute pas de PHP. Les formulaires valident les
  champs et affichent un message, mais n'envoient rien. Un service tiers
  (Web3Forms, Formspree) ou un hébergement PHP est nécessaire.
- **Les photos du site existant font 148 × 134 px.** Elles sont volontairement
  affichées près de cette taille pour rester nettes. Des originaux en haute
  définition permettraient des visuels plus généreux.
- **`old-co2ls/send_email.php` contenait en clair le mot de passe d'application
  Gmail du compte `co2laserservice@gmail.com`.** Il a été retiré du fichier,
  mais il reste présent dans l'historique Git et a été exposé publiquement. Ce
  mot de passe doit être révoqué depuis le compte Google.
- **La carte du rayon d'intervention (page moderne) charge son fond depuis les
  tuiles publiques d'OpenStreetMap**, qui ne demandent aucune clé d'API. Leur
  politique d'usage vise les usages modestes : suffisant pour la démonstration
  et un trafic normal de site vitrine. En production, le plus propre est un
  fournisseur avec clé et palier gratuit (Stadia Maps « Alidade Smooth Dark »,
  MapTiler « Dark Matter », ou CARTO avec compte) ; ces fonds étant déjà
  sombres, il faut alors retirer le filtre CSS. Une seule ligne à changer :
  l'appel `L.tileLayer` dans `moderne/js/carte.js`.
