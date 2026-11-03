# La Mouna — contrôle du master prompt PWA

Audit et mise en œuvre du 3 novembre 2026. Référence : « PWA MASTER PROMPT — Creative Edition » fourni par le propriétaire dans son projet François (version du 1er novembre). Périmètre : site client `francois1343/Site`, https://lamouna.vercel.app/ ; le terminal cuisine séparé n'est pas publié ici.

## Résultat par exigence

| Partie du prompt | Avant | Réalisation / limites |
| --- | --- | --- |
| 1. Audit | Vitrine HTML/CSS/JS, panier local, 91 articles, 12 tests | Architecture et données réutilisées ; aucun framework ajouté. |
| 2. Icônes et manifest | Un favicon SVG, pas de manifest | Même monogramme exporté en ICO, PNG 16/32/180/192/512, maskable 192/512 ; manifest relatif et identité stable. |
| 3. Installation | Absente | Proposition après deux interactions et délai ; Installer / Plus tard (7 jours) / Ne plus proposer. Aucun prompt natif sans clic. Mode standalone et appinstalled ; instructions manuelles iOS et navigateurs sans événement. |
| 4. Service worker | Absent | Un seul SW généré au build, version par empreinte. Précache explicite des seuls fichiers publics ; pas d'API, mutations, ressources tierces ni données client. |
| 5. Hors ligne | Carte dépendante du réseau | Coquille et cinq illustrations précachées ; menu réseau avec délai de 5 s puis cache identifié. Avertissement et Réessayer vérifiant réellement build.json (7 s). Première visite hors ligne non garantie. |
| 6. Mise à jour | Absente | Bannière seulement pour SW en attente / changement réel de contrôleur ; « J’ai compris » active puis recharge au plus une fois. « Plus tard » conserve la session. Brouillon sauvegardé avant activation, blocage si impossible. |
| 7. Notifications | Toast panier | Notifications internes uniquement. Pas de permission système ni de Web Push : aucun serveur de notifications dans cette vitrine. |
| 8. Stockage / synchronisation | Panier local versionné, migration et conflits | Préservé ; remarques/service en sessionStorage par onglet. Aucune commande mise en file ni synchronisation inter-appareils. IndexedDB inutile pour ce volume. |
| 9. UX / accessibilité | Clair/sombre, modales, navigation basse téléphone | Galerie interactive, miniatures avec état annoncé, filtre En images, catégories avec icônes, barre basse jusqu'à 1100 px, focus et mouvement réduit. Pas de certification WCAG annoncée. |
| 10. Sécurité / performance | HTTPS et CSP restrictive | Conservés ; polices système sans requêtes tierces ; images existantes WebP responsive, build public sur liste autorisée, aucun suivi ajouté. |
| 11. Architecture | Panier séparé dans cart.mjs | pwa.js / sw.js / manifest / atelier.css / tests séparés ; pas de dépendance de production. |
| 12. Tests réels | 12 tests Node/jsdom | 17 tests réussis, build réussi. Les tests SW utilisent un contexte isolé, pas le moteur réseau de Chrome. Recette de publication consignée ci-dessous. Installation physique Android/iOS et Lighthouse non validés. |
| 13. Livraison / documentation | README existant | Présent document, README actualisé, code versionné dans le dépôt existant. |

**Statut : implémentation complète des fonctions pertinentes ; recette matérielle partielle.** « Tout validé à 100 % » serait inexact : installation physique, offline et cycle N → N+1 doivent aussi être vérifiés sur les appareils cibles. Paiement, commande reçue en cuisine et Web Push ne font pas partie des fonctionnalités actives.

## Direction artistique et sources

Les cinq illustrations Margarita, Prochoto, Hawai, 4 Fromages et Jadot restent les mêmes, avec leur cadre et leur marque. Aucun visuel d'une recette n'est attribué à une autre. Les fiches sans illustration restent lisibles et compactes.

Transposition des trois dossiers de design de Jule : énergie des titres/cadres de Fortnite, structure et lignes de Valorant, papier/photographies/flèche du carnet Inoxtag. Le contenu de ces univers et leurs personnages ne sont pas copiés dans la pizzeria. Palette La Mouna : bois, crème, basilic, terre cuite ; logo et préférence clair/sombre conservés.

Références de composition consultées : [The Pizza Factory — branding](https://www.behance.net/gallery/186005433/The-Pizza-Factory-Packaging-Branding), [Orégano — identité de pizzeria](https://www.behance.net/gallery/175555077/Organo-Brand-Identity-for-an-Artisan-Pizzeria), recherches Pinterest sur les affiches de pizzeria. Aucune image tierce de ces références n'est embarquée.

L'[Office du tourisme de Beaumont](https://www.tourismebeaumont.be/Restaurants) confirme l'adresse Chaussée de Chimay 12, le téléphone 071 32 78 74 et la fermeture du lundi. Les autres horaires et les prix sont ceux du projet et restent à confirmer par le commerçant. La page Facebook recherchée n'a pas été accessible : aucune photographie ni information prétendument lue sur Facebook n'est ajoutée.

## Cache et données

- `tools/build.mjs` produit une version déterministe selon les fichiers et le code SW, puis injecte la liste exacte dans `dist/sw.js`.
- Coquille et assets : cache de version, pour éviter de mélanger les versions ; menu public : Network First avec repli. Les réponses invalides/redirects ne remplacent pas la carte.
- Deux caches publics maximum à l'activation pour ménager les onglets de la version précédente. Aucun effacement des autres caches ou de localStorage/sessionStorage.
- La première activation ne force pas `clients.claim()` ; l'interface n'annonce donc pas une mise à jour fictive à la première installation. Le contrôle SW prend effet à la navigation suivante.
- Les routes avec paramètres de requête inconnus ne sont pas mises en cache. Les ancres historiques fonctionnent toujours.
- Panier : localStorage, mécanismes et sauvegarde préalable existants. Brouillon : sessionStorage, durée de l'onglet. Pas de promesse de conservation après fermeture de l'onglet.
- Les données de paiement, de commande, du terminal et les données du projet François ne sont jamais copiées dans le site.

## Maintenance et retour arrière

`npm ci --ignore-scripts`, `npm run build`, `npm test`. Les tests PWA exigent le build préalable. Publier sur la branche main déjà reliée à Vercel, puis vérifier son statut et les ressources en ligne. Le build exclut docs, tests, outils, sources originales et provenance.

Pour revenir en arrière, rétablir le code voulu avec un nouveau commit, reconstruire et publier. Les versions PWA déjà installées recevront ce retour comme une nouvelle version, après leur accord. Revenir à un déploiement antérieur à la PWA ne supprime pas automatiquement les SW installés : garder le mécanisme de mise à jour ou prévoir un SW de retrait dédié ; ne pas demander aux clients de vider leurs paniers.

## Recette de publication

- Production existante consultée dans Chrome distant avant modification ; elle reste sur le commit `4eee51b`.
- Proposition sauvegardée dans la branche `codex/lamouna-visuel-pwa`, PR brouillon https://github.com/francois1343/Site/pull/1.
- Vercel confirme le déploiement de prévisualisation du commit `cc1548b7b5c349cadb585372c2365898b8be7c02` (statut success).
- Aperçu : https://lamouna-git-codex-lamouna-visuel-pwa-francois1343s-projects.vercel.app ; l'ouverture dans Chrome distant redirige vers la connexion Vercel. Aucun contournement ni désactivation de cette protection.
- La prévisualisation locale est inaccessible depuis ce navigateur distant (connexion refusée sur 127.0.0.1:8898).
- La publication sur main a été bloquée par la vérification automatique d'autorisation. Elle attend un accord explicite du propriétaire ; aucune fusion effectuée.
- Le nouveau rendu, l'installation réelle, l'offline réel et le cycle N → N+1 dans Chrome ne sont donc pas déclarés validés. Les 17 tests réussis sont des tests Node/jsdom/VM, pas une recette graphique ou matérielle de tablette.
