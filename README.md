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

La carte est pilotée par `moderne/js/carte.js` : chaque point y est décrit par
ses coordonnées géographiques réelles, la position à l'écran s'en déduit. Les
textes associés vivent dans `assets/js/content.js` (clés `m.field.z*`) et
décrivent des zones couvertes, pas des chantiers datés — à remplacer par de
vraies références si le client souhaite en afficher.

La carte affiche aussi une silhouette de littoral (façade Atlantique/Manche,
côte belgo-néerlandaise) et les frontières France/Allemagne/Belgique/Suisse,
tracées à la main à partir de coordonnées réelles approximatives — un tracé
stylisé, pas cadastral, avec des libellés « FRANCE »/« ALLEMAGNE » discrets
pour lever toute ambiguïté. Ces tracés (`LAND`, `FRONTIERES` dans carte.js)
passent par la même projection que les points de ville, donc restent alignés
si `BASE` ou `VIEW` changent — ne jamais fixer l'aspect-ratio du conteneur
`.carte` autrement qu'en JS (`carte.style.aspectRatio`), sous peine de
désaligner points et fond de carte.

La section « machines couvertes » est une vitrine à défilement automatique
(`moderne/js/machines.js`) : un panneau par machine, alterné toutes les
4,8 s, pilotable au clic ou au clavier, en pause au survol. Respecte
`prefers-reduced-motion` (pas de défilement automatique).

**Les deux** — Textes réécrits et corrigés, site réellement trilingue FR / DE /
EN, aucune dépendance externe (ni Google Fonts, ni CDN), `prefers-reduced-motion`
respecté.

## Organisation

```
assets/
  js/content.js     tous les textes, dans les trois langues — source unique
  js/i18n.js        moteur de traduction (data-i18n, mémorisation du choix)
  img/  font/       reprises telles quelles du site existant
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
