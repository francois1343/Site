# La Mouna — site client responsive

Production : **https://lamouna.vercel.app/** · dépôt `francois1343/Site`, branche `main`.

La version du 3 novembre 2026 reprend la carte publiée : **54 pizzas, 91 références au total, sept catégories**. Les cinq illustrations fournies (Margarita, Prochoto, Hawai, 4 Fromages et Jadot) accompagnent les recettes correspondantes. Les autres fiches affichent leurs ingrédients sans inventer une image du plat. Le clair/sombre conserve la préférence existante.

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

Les PNG d'origine sont restés sur le PC. Les exports WebP conservent le cadre entier et la marque existante : 640 et 1280 px, `srcset`, dimensions explicites et chargement différé des cartes. Les dix exports totalisent environ 1,08 Mo. `images/provenance.json` conserve les noms et empreintes des fichiers fournis ; il n'est pas publié par le build. Il ne constitue pas une preuve de licence des illustrations.

Le panier utilise `localStorage` sur l'origine du site. Aucun compte, donnée bancaire, traqueur ou synchronisation du panier avec un autre appareil n'est ajouté. Les polices Google Fonts étaient déjà utilisées ; les familles de repli restent disponibles.

## Développement et publication

Node 24 : `npm ci --ignore-scripts`, `npm test`, `npm run build`. Les dépendances sont uniquement destinées aux tests ; le navigateur utilise HTML/CSS/JS sans framework. Pour un aperçu local : `python -m http.server 8898 --directory dist`.

Vercel construit `dist` selon `vercel.json`. La liste du build contient seulement l'interface, la carte et les images. Ni tests, outils, anciens HTML de démonstration, fichier du coffre, base ou secret ne sont publiés. Les anciens liens `#pizzas`, `#entrees`, `#pates`, etc. restent reconnus.

Les tests couvrent fiches, ajout, quantités, persistance, copie, catégories, recherche, clair/sombre, migration, quota, données invalides et conflits. Les règles de disposition ciblent petits téléphones, tablettes et desktop avec zones sûres, images adaptatives, boutons tactiles et mouvement réduit. **Le navigateur pilotable étant indisponible dans cette séance, aucune capture ni recette visuelle physique Android/iOS n'est annoncée.** Vérifier ces appareils avant d'engager le site comme service de commande opérationnel.
