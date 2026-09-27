# CO2 LASER SERVICES — refonte du site

Deux propositions ont été présentées au client. **Il a retenu la version
moderne**, seule publiée désormais.

| | Adresse | Ce que c'est |
|---|---|---|
| Accueil | `/` | Redirection vers `/moderne/` |
| Site | `/moderne/` | Page unique à ancres, plus une page de mentions légales et une page de CGV |
| Maquette écartée | `classique/` dans le dépôt | Reproduction du site existant. Conservée comme référence, **plus mise en ligne** |

## Ce qui a été fait

**Version moderne** — Une seule page, navigation par ancres, en-tête qui se
condense au défilement. Halo conique et faisceau de découpe animés dans le
héros, révélations progressives, frise de méthode qui se trace, projecteur
suivant le curseur sur les cartes. Cinq sections nouvelles par rapport au site
actuel : chiffres clés, signature « 10,6 µm », méthode d'intervention, machines
couvertes et carte du rayon d'intervention.

**Version classique (écartée)** — Au-dessus de 1024 px, le rendu reprenait la
grille 980 px d'origine, les sprites de boutons-triangles, les positions
absolues et les images du site existant : à l'écran, rien ne bougeait. En
dessous de 1024 px, tout le gabarit était réécrit (barre supérieure, navigation
basse reprenant les mêmes triangles, contenu en cartes). Le code reste dans le
dépôt, mais le workflow de déploiement ne le copie plus.

**Les deux** — Textes réécrits et corrigés, site réellement trilingue
FR / DE / EN, aucune dépendance externe (ni Google Fonts, ni CDN).

### Carte du rayon d'intervention

C'est une vraie carte Leaflet, pas un schéma : on peut y zoomer, et le dézoom
est bloqué au cadre France–Allemagne–Royaume-Uni (calculé dynamiquement via
`map.getBoundsZoom()`, donc toujours juste quelle que soit la largeur d'écran).
Leaflet est fourni en local dans `assets/vendor/leaflet/` (licence BSD-2-Clause,
voir le fichier `LICENSE` à côté) : pas de CDN pour le moteur de la carte.
**Les tuiles de fond, elles, sont chargées en ligne depuis OpenStreetMap.**
C'est le cas de toute carte Leaflet ou Google Maps embarquée, la carte a donc
besoin d'une connexion Internet pour afficher son fond (les marqueurs et
l'interaction fonctionnent quoi qu'il arrive).

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
pas des chantiers datés. À remplacer par de vraies références si le client
souhaite en afficher.

### Machines couvertes

Vitrine à défilement automatique (`moderne/js/machines.js`) : une grande carte
« en scène » avec la machine active, les trois autres empilées à côté. Cliquer
une carte de la pile la fait passer en scène. Une seule horloge
(`requestAnimationFrame`) pilote à la fois la barre de progression et le
balayage lumineux, ce qui rend toute désynchronisation impossible. Avance
automatique toutes les 4,8 s, pilotable au clic ou au clavier, en pause au
survol et au focus clavier.

### Conditions générales de vente

`moderne/cgv.html` reprend la mise en page des mentions légales : les dix
articles et quarante alinéas du PDF contractuel sont transcrits dans
`assets/js/content.js` (clés `p7.*`), avec un sommaire ancré et un bouton de
téléchargement du PDF. Le document n'existant qu'en français, une note en
allemand et en anglais indique que seule la version française fait foi.

### Emplacements photo

Les sections « Nos prestations » et « Notre méthode » contiennent des
emplacements photo (`.photo-slot`) affichés **comme des emplacements**, pas
comme des images de remplissage : la légende annonce le sujet attendu, ce qui
vaut brief pour les photos à fournir. À remplacer par un `<img>` dès réception,
le bloc garde alors ses proportions.

## Organisation

```
assets/
  js/content.js     tous les textes, dans les trois langues — source unique
  js/i18n.js        moteur de traduction (data-i18n, mémorisation du choix)
  img/  font/       reprises telles quelles du site existant
  vendor/leaflet/   bibliothèque Leaflet, hébergée en local (licence BSD-2-Clause)
  CGV.pdf           document contractuel, proposé au téléchargement
classique/          maquette écartée — 7 pages, plus déployée
moderne/            le site — page unique + mentions légales + CGV
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
  définition permettraient des visuels plus généreux, et rempliraient les
  emplacements photo prévus dans les sections prestations et méthode.
- **Un mot de passe d'application Gmail a été exposé publiquement.** Le fichier
  `send_email.php` du site existant le contenait en clair pour le compte
  `co2laserservice@gmail.com`. L'extraction de l'ancien site a été retirée du
  dépôt, puis **l'historique a été réécrit** (`git filter-repo`) sur les deux
  branches : plus aucun objet du dépôt local ne contient ce mot de passe.

  **Cela ne suffit pas, et il faut le savoir.** Après un push forcé, GitHub
  garde les anciens commits accessibles par leur empreinte, et les sert encore
  via `raw.githubusercontent.com`. Vérifié après la réécriture : l'ancien
  fichier répondait toujours en HTTP 200. Seul le ramasse-miettes de GitHub
  les fait disparaître, et il ne se déclenche pas à la demande. Deux recours
  possibles, à demander explicitement : ouvrir un ticket au support GitHub
  pour réclamer le nettoyage, ou supprimer puis recréer le dépôt.

  **Dans tous les cas, la seule mesure qui règle vraiment le problème est la
  révocation du mot de passe depuis le compte Google** (mots de passe
  d'application). Un secret publié doit être considéré comme compromis, quel
  que soit le ménage fait ensuite.
- **Les témoignages sont des exemples**, signalés comme tels à l'écran (clés
  `m.temoin.*`). À remplacer par de vrais retours clients, ou à retirer.
- **La carte du rayon d'intervention charge son fond depuis les tuiles publiques
  d'OpenStreetMap**, qui ne demandent aucune clé d'API. Leur politique d'usage
  vise les usages modestes : suffisant pour la démonstration et un trafic normal
  de site vitrine. En production, le plus propre est un fournisseur avec clé et
  palier gratuit (Stadia Maps « Alidade Smooth Dark », MapTiler « Dark Matter »,
  ou CARTO avec compte) ; ces fonds étant déjà sombres, il faut alors retirer le
  filtre CSS. Une seule ligne à changer : l'appel `L.tileLayer` dans
  `moderne/js/carte.js`.
- **Aucune balise Open Graph.** Un lien partagé (WhatsApp, LinkedIn, e-mail)
  n'affiche donc pas d'aperçu.
