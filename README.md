# La Mouna — site client responsive

Production : **https://lamouna.vercel.app/** · dépôt `francois1343/Site`, branche `main`.

La version du 11 novembre 2026 conserve **54 pizzas et 91 références, réparties en sept catégories**. **53 pizzas sont illustrées** : les sept visuels précédents sont conservés et 46 illustrations retrouvées ont été associées à partir de l’ordre de la carte du site et des garnitures visibles. Raclette reste sans image. Les associations sont à confirmer par la pizzeria ; prix et recettes sont inchangés. Le clair/sombre conserve la préférence existante.

## Parcours client

- Carte filtrable par catégorie et recherche dans les noms/ingrédients.
- « Voir la pizza » ouvre l'illustration, la recette, le prix et le choix de quantité.
- « Ajouter » et les contrôles du panier calculent en centimes entiers.
- Panier fixe en bas sur mobile, fiches et panier en panneaux adaptés à la hauteur disponible.
- Ancien panier conservé avant migration ; panier invalide non remplacé, conflits entre onglets signalés. Les Web Locks sont utilisés lorsqu'ils sont disponibles ; sans eux, la vérification de la version enregistrée limite les écrasements mais ne constitue pas une transaction multi-onglets.
- Copie du récapitulatif puis appel au numéro déjà publié pour confirmer. Les remarques restent dans la page, sans envoi automatique.

**La commande en ligne et le paiement bancaire ne sont pas raccordés.** Le site n'affiche aucun faux succès et n'envoie aucune commande à une API inexistante. Appeler ne vide pas le panier ni ne marque une commande comme acceptée. La livraison, son prix et la disponibilité se confirment avec le commerçant. Les données de carte, horaires et coordonnées proviennent du site précédent ; elles ne constituent pas une vérification indépendante de l'activité actuelle.

Le terminal cuisine développé séparément dans le Cerveau/La Mouna n'est pas inclus dans ce déploiement statique. Ne pas exposer sa base, ses codes ou ses routes privées dans `dist`.

## Images et données

`menu.json` conserve la provenance et l'empreinte de l'HTML source. La référence précédente est archivée sous `source/`, exclue du site construit. Les outils sous `tools/` servent à extraire et vérifier la carte, pas à recréer automatiquement les sources du commerçant.

Les PNG d'origine sont restés sur le PC. Les exports WebP conservent le cadre entier et la marque existante : 640 et 1280 px, `srcset`, dimensions explicites et chargement différé des cartes. Les dix premiers exports totalisaient environ 1,08 Mo. `images/provenance.json` conserve les noms et empreintes des fichiers fournis ; il n'est pas publié par le build. Il ne constitue pas une preuve de licence des illustrations.

Le panier utilise `localStorage` sur l'origine du site. Aucun compte, donnée bancaire, traqueur ou synchronisation du panier avec un autre appareil n'est ajouté. Les polices système évitent les requêtes Google Fonts et restent disponibles hors ligne.

## Développement et publication

Node 24 : `npm ci --ignore-scripts`, `npm run build`, `npm test`. Les dépendances sont uniquement destinées aux tests ; le navigateur utilise HTML/CSS/JS sans framework. Pour un aperçu local : `python -m http.server 8898 --directory dist`.

Vercel construit `dist` selon `vercel.json`. La liste du build contient seulement l'interface, la carte et les images. Ni tests, outils, anciens HTML de démonstration, fichier du coffre, base ou secret ne sont publiés. Les anciens liens `#pizzas`, `#entrees`, `#pates`, etc. restent reconnus.

Les tests couvrent fiches, ajout, quantités, persistance, copie, catégories, recherche, clair/sombre, migration, quota, données invalides et conflits. Les règles de disposition ciblent petits téléphones, tablettes et desktop avec zones sûres, images adaptatives, boutons tactiles et mouvement réduit. **Le navigateur pilotable étant indisponible dans cette séance, aucune capture ni recette visuelle physique Android/iOS n'est annoncée.** Vérifier ces appareils avant d'engager le site comme service de commande opérationnel.

## Version visuelle et PWA

Galerie des pizzas illustrées, miniatures interactives, filtre En images, catégories illustrées et navigation basse téléphone/tablette. Identité crème/vert/terre cuite inspirée des compositions de Jule, avec les illustrations existantes.

Installation discrète, icônes complètes, carte hors ligne après précache, indication de connexion et mises à jour par « J’ai compris ». Panier conservé ; brouillon privé à l’onglet. Aucun paiement, envoi de commande ou Web Push activé. Les 13 volets du prompt et leurs limites sont détaillés dans [docs/PWA.md](docs/PWA.md).

### Bianca et Rimini

Deux illustrations générées ajoutées aux bonnes recettes, à la galerie, au filtre En images et au cache PWA. Exports WebP 640/1280 px, qualité 92, sans recadrage ; originaux conservés séparément. Les prix et ingrédients restent inchangés. La galerie défile horizontalement lorsque sept miniatures ne tiennent pas sur le petit écran.


## Visuels retrouvés — 11 novembre 2026

Les 47 images de la galerie locale n’étaient pas publiées. Après rapprochement
avec l’ordre de la carte du site indiqué par François et examen visuel des
garnitures, 46 recettes reçoivent leur illustration : **53 pizzas illustrées sur
54**. La Bianca déjà présente est conservée (photo-01 fait doublon probable) ;
la Raclette reste sans image faute de correspondance suffisamment claire.
Les rapprochements sont éditoriaux, à confirmer par la pizzeria ; ce ne sont pas
des photographies contractuelles ni une validation des ingrédients/allergènes.

`images/recovered-provenance.json` conserve les associations, dimensions et
empreintes des originaux/exports. Les originaux du Bureau restent inchangés.
`tools/prepare-recovered-images.py` produit seulement des exports WebP du cadre
entier. Les 92 nouveaux fichiers pèsent 9,91 Mo (décimaux). La galerie, les fiches,
le filtre En images et le cache PWA utilisent maintenant la même carte.
Le build ne publie que les images nommées par la carte ; aucune base du terminal,
clé ou configuration locale n’est incluse. Prix, identifiants et recettes inchangés.
