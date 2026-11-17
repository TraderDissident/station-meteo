# Journal des modifications

## 1.16.1 · 17/11/2026

- Carte en plein écran : plus de débord ni de glisser de côté. La carte entière s'adapte à l'écran, bord à bord en largeur, centrée en hauteur ; le reste reste vide.

## 1.16.0 · 17/11/2026

- Carte du monde en plein écran : un bouton dans l'en-tête masque l'en-tête et les cartes de villes ; il reste la règle des fuseaux, la carte et un bouton de sortie posé dessus. La carte prend toute la hauteur de l'écran (sur l'iPad en paysage, 1625 × 722 au lieu de 992 × 441) et se fait glisser de côté ; elle s'ouvre centrée sur le lieu affiché.

## 1.15.1 · 17/11/2026

- Carte du monde : les sélecteurs (style, carte ou globe, horloges ou météo) passent dans un panneau qui s'ouvre et se ferme par un bouton à curseurs dans l'en-tête, posé sur la carte sans lui prendre de place. Il se referme en touchant ailleurs.

## 1.15.0 · 17/11/2026

- Carte du monde : plus de titre « Carte du monde » ; les sélecteurs (style, carte ou globe, horloges ou météo) prennent sa place dans l'en-tête, en plus petit. La carte gagne la hauteur de la rangée de sélecteurs qui était sous elle. En portrait, ils tiennent sur deux lignes.

## 1.14.1 · 17/11/2026

- Réglages : « Intensité » devient « Assombrissement de l’écran la nuit », réglé par un curseur sur toute la largeur, « Plus clair » à gauche, « Plus sombre » à droite (de 20 % à 85 % par pas de 5 %), au lieu de trois boutons 35, 55 et 70 %.

## 1.14.0 · 17/11/2026

- Réglages, voile de nuit : « De » et « À » prennent le champ d'heure de Travel Hub (TimePickerField). Un bouton à horloge ouvre deux colonnes, heures puis minutes, chacune centrée sur la valeur choisie, et « Maintenant ». Choisir l'heure garde les minutes ; choisir les minutes referme. Le voile se règle donc à la minute (23:45 par exemple) ; les horaires enregistrés en heures entières restent valables.

## 1.13.6 · 17/11/2026

- Réglages : listes déroulantes avec un chevron dessiné par l'app, à distance du bord (celui du système collait à la bordure) ; « De » et « À » du voile de nuit côte à côte au lieu de se partager toute la largeur.

## 1.13.5 · 17/11/2026

- Carte du monde, glisser des étiquettes : plus aucun nouveau placement ni reconstruction de la carte tant qu'une étiquette est tenue (données qui arrivent, fenêtre redimensionnée, retour sur l'onglet) ; le trait suit toujours l'étiquette tenue ; position et taille relues au début de chaque geste.

## 1.13.4 · 17/11/2026

- Carte du monde, glisser des étiquettes : le glisser s'arrête net au relâchement (avant, l'étiquette restait accrochée au curseur 0,4 s, et un nouveau glisser commencé dans ce délai était coupé en route) ; l'arrivée de données météo pendant un glisser ne reconstruit plus l'étiquette sous le curseur ; bouton relâché hors de la fenêtre, le glisser se termine.

## 1.13.3 · 17/11/2026

- Globe : les étiquettes ne sautent plus d'un côté à l'autre. Comme sur la carte des trajets de Travel Hub, chacune reste collée à droite de son point et tourne avec lui ; quand deux se recouvrent, la seconde s'efface (son point reste) au lieu de se déplacer. Plus de traits de rappel sur le globe.

## 1.13.2 · 17/11/2026

- Carte du monde : aucune étiquette ne bouge plus d'elle-même. Seule celle que l'on glisse change de place, même si elle en chevauche une autre ou si des traits se croisent.

## 1.13.1 · 17/11/2026

- Carte du monde : déplacer une étiquette ne bouscule plus les autres. Chaque étiquette placée automatiquement garde sa place ; seule celle que l'étiquette déplacée vient gêner se replace. Un rafraîchissement des données ne déplace plus rien non plus.

## 1.13.0 · 17/11/2026

- Carte du monde : les étiquettes de villes se placent à la main. On glisse une étiquette (doigt ou souris) où l'on veut, le trait de rappel suit ; avec Maj enfoncée, le trait se cale à 0°, 45°, 90°… Position retenue par ville et par orientation (paysage, portrait), en proportion de la carte. Reposée sur son point, l'étiquette repasse au placement automatique, qui s'arrange autour des étiquettes placées à la main. Un glisser n'ouvre pas la ville.
- La carte ne peut plus bloquer l'app si son code ne démarre pas : retour aux prévisions avec un message, au lieu de relancer le chargement sans fin.

## 1.12.0 · 17/11/2026

- Carte du monde : nouveau placement des étiquettes de villes. Elles se posent tout autour de leur point, à droite comme à gauche, au-dessus ou au-dessous, plus loin avec un trait de rappel quand la place manque. Jamais l'une sur l'autre, au moins 10 px entre deux étiquettes, jamais sur un point de ville ; les traits évitent de se croiser et de traverser une étiquette, sauf s'il n'y a pas d'autre place.
- Étiquettes de la carte 10 % plus petites (textes, icônes, marges), et encore un peu plus en portrait où la carte est moitié moins haute.
- Globe en rotation : placement rapide des étiquettes pendant le mouvement, placement complet à l'arrêt, pour ne pas ralentir le vieil iPad.

## 1.11.1 · 17/11/2026

- Températures négatives : le signe moins déborde à gauche comme le ° à droite. Le nombre reste centré et le ° ne frôle plus le cercle du cadran.

## 1.11.0 · 17/11/2026

- Singapour et Tokyo rejoignent les lieux d'origine, à leur place d'ouest en est. Sur un appareil déjà installé, ils s'ajoutent une fois à la liste enregistrée.

## 1.10.2 · 17/11/2026

- Températures centrées sur leurs chiffres, le ° en débord à droite, dans le cadran et sur la courbe heure par heure. Avant, le cadran poussait le nombre vers la droite et les étiquettes de la courbe comptaient le ° dans leur centrage.

## 1.10.1 · 17/11/2026

- Un rechargement de l'app (mise à jour, rechargement de 4 h, rechargement manuel) garde le lieu affiché. Seule une vraie ouverture revient au lieu de démarrage, s'il est défini.

## 1.10.0 · 17/11/2026

- 15 lieux d'origine en plus, rangés d'ouest en est : Tahiti, Bogota, New York, Lisbonne, Marrakech, Dublin, Bordeaux, Aigre, Barcelone, Paris, Istanbul, Moscou, Ahvaz, Dubaï, Pattaya, Tiksi, Vladivostok, Sydney. Sur un appareil déjà installé, ils s'ajoutent une fois aux lieux enregistrés et toute la liste est rangée d'ouest en est.

## 1.9.0 · 17/11/2026

Allègement pour le vieil iPad, sans toucher aux animations.

- Réseau : les fichiers de l'app en cache ne sont plus redemandés au réseau à chaque ouverture (25 requêtes et 420 Ko d'images de la Terre en moins par lancement). Les images de la Terre sont reprises de l'ancien cache lors d'une mise à jour.
- Démarrage : la carte du monde (contours, frontières, globe, 155 Ko de code) ne se charge qu'à sa première ouverture. Le code lu au démarrage passe de 300 Ko à 144 Ko.
- Météo : on ne demande plus à Open-Meteo que les grandeurs affichées (3 colonnes horaires et 6 autres valeurs en moins) ; les données rangées par lieu passent de 47 Ko à 39 Ko, écrites une fois par rafraîchissement au lieu de deux. Rafraîchissement toutes les 15 min au lieu de 10, le rythme auquel Open-Meteo renouvelle ses valeurs.
- Tâches répétées : l'heure et la date ne sont réécrites que lorsqu'elles changent (avant : trois réécritures par seconde, donc un recalcul de l'affichage chaque seconde) ; le voile de nuit ne vérifie plus toutes les 2 s, il programme un seul réveil.
- Mémoire de la carte : les canevas sont rendus dès qu'on quitte la carte ou qu'on change de style ; les deux textures du globe (8 Mo chacune) sont rendues après envoi à la carte graphique ; le globe ne crée plus de tableaux à chaque image.

## 1.8.1 · 17/11/2026

- Points de la courbe des températures : la courbe se recale aussi après une rotation, un changement de taille de fenêtre et le chargement des polices, au sous-pixel près. Avant, elle gardait la position du premier affichage.

## 1.8.0 · 17/11/2026

- Conditions, Précipitations, Vent refait d'après Météo d'Apple sur iOS 27 : sélecteur à trois icônes (nuage, goutte, vent), titre et sous-titre selon le mode. Le cadran ne change pas, comme chez Apple.
- Précipitations : une colonne par heure remplie selon l'intensité (pointillés aux seuils modéré et fort), risque de pluie sous la ligne. Vent : vitesse en chiffres, courbe commune dessous avec les rafales en aplat.
- 10 jours selon le mode : pluie heure par heure de chaque jour avec millimètres et risque ; vent en petite courbe avec la plage de vitesse.
- Les points de la courbe des températures sont exactement sur la courbe (ils étaient décalés de quelques pixels).

## 1.7.0 · 17/11/2026

- Heure par heure : choix d'affichage Conditions, Précipitations ou Vent, comme l'app Météo d'Apple. Conditions : la courbe des températures (comme avant). Précipitations : barres de pluie par heure, probabilité et millimètres. Vent : courbe de la vitesse colorée selon la force, direction et rafales. Le choix est gardé et vaut aussi pour les heures d'un jour ouvert dans les 10 jours.

## 1.6.0 · 16/11/2026

- Détails modifiables, comme les tableaux de bord du Socle : bouton Modifier (ou appui long sur un bloc), les blocs tremblent, « − » pour en retirer, « + » sous la grille pour les remettre, glisser au doigt ou à la souris pour les réordonner. Terminé pour sortir. L'ordre et les blocs retirés sont gardés, pour tous les lieux.
- Voile de nuit : il ne tombe qu'après 30 s sans aucune activité (souris, doigt, clavier, molette) ; bouger la souris le lève aussitôt.

## 1.5.2 · 16/11/2026

- Voile de nuit : il ne tombe qu'après 30 s sans aucune activité (souris, doigt, clavier, molette). Bouger la souris ou toucher l'écran le lève aussitôt.

## 1.5.1 · 16/11/2026

- Lune et Qualité de l'air côte à côte sur la même ligne, en paysage comme en portrait. Sans données d'air, la Lune reprend toute la largeur.

## 1.5.0 · 16/11/2026

- Mises à jour : la page se charge d'abord depuis le réseau, le cache ne sert plus qu'hors connexion. Avant, le service worker servait l'ancienne page, qui pointait vers les anciens fichiers.
- À l'ouverture et au retour sur l'app (au plus toutes les 30 min), l'app compare sa version à celle en ligne et se met à jour seule si elle est en retard.
- Réglages, À propos : version en ligne affichée, et bouton « Forcer la mise à jour », qui efface le service worker et les caches puis recharge.

## 1.4.2 · 16/11/2026

- iPad tenu en portrait : l'app se croyait parfois en paysage (iOS 12 garde les dimensions d'avant la rotation). L'orientation vient maintenant de l'appareil. C'était la cause du cadran qui débordait derrière les cartes et hors de l'écran.
- La page descend jusqu'en bas de l'écran : iOS 12 retirait 20 points sous la barre d'état translucide.
- Tableau des 10 jours : quand sa colonne est étroite, il passe en version resserrée (sans la colonne du vent) au lieu de déborder à droite.
- En paysage, le cadran se réduit si sa colonne est trop étroite pour lui.

## 1.4.1 · 16/11/2026

- Carte et globe : le soleil clignotant et la lune ne sont plus affichés, le contraste jour/nuit suffit.

## 1.4.0 · 16/11/2026

- Le style Satellite montre maintenant de vraies images, les mêmes que la carte des trajets de Travel Hub : NASA Blue Marble avec relief et fonds marins le jour, lumières des villes vues par le satellite VIIRS la nuit. Les images sont rangées dans l'app (420 Ko) : elles marchent hors connexion. Plus de relief inventé ni de faux nuages.
- Nouveau sélecteur Carte | Globe : la Terre en 3D (WebGL), éclairée par le soleil à la minute, avec halo d'atmosphère, dans chacun des cinq styles. Elle tourne doucement (selon le réglage Animations) et se fait tourner au doigt ; elle reprend sa rotation 20 s après. Les villes, le soleil et la lune suivent la rotation.

## 1.3.0 · 16/11/2026

- Cinq styles pour la carte du monde, au choix sous la carte et mémorisés :
  - Nature : couleurs des climats, frontières discrètes ;
  - Satellite : océans profonds et plateaux continentaux plus clairs, terres texturées, banquise, voile de nuages avec leur ombre, nuit noire vue de l'espace ;
  - Épuré : mer noire, terres grises unies sans frontières, nuit gris foncé, limite jour/nuit en trait blanc ;
  - Atlas : carte papier claire, la nuit posée comme une ombre bleutée ;
  - Néon : fond noir, côtes lumineuses cyan le jour et violettes la nuit.
- Frontières entre pays : Natural Earth (domaine public).

## 1.2.0 · 16/11/2026

- Nouvelle vue Carte du monde (bouton globe, en haut à droite) :
  - jour, nuit et crépuscule calculés à la minute sur toute la Terre, avec un liseré de crépuscule dégradé ;
  - soleil et lune placés à leur aplomb, lune à sa phase réelle, reflet du soleil sur l'océan ;
  - couleurs des climats sur les terres le jour, océan profond et étoiles la nuit ;
  - règle des 24 fuseaux en haut, avec l'heure de chacun et celle de l'iPad en blanc ;
  - chaque ville marquée de sa météo, sa température et son heure, étiquettes placées sans chevauchement ;
  - sous la carte, au choix : horloges à aiguilles (claires le jour, sombres la nuit) ou cartes météo peintes aux couleurs du ciel de chaque ville, avec écart horaire, lever, coucher et position dans la journée.
- Toucher une ville sur la carte ou sous la carte ouvre sa page. La vue affichée est retenue au redémarrage.
- Tracé des terres : Natural Earth (domaine public).
- Le service worker ne s'installe plus en local, pour que les essais voient toujours les derniers fichiers.

## 1.1.0 · 16/11/2026

- Anglais par défaut, français au choix dans Réglages, Langue (ou langue de l'iPad avec « Automatic »).
- Tout l'affichage est traduit : écran Diagnostic, badge de démonstration, heures des réglages, noms des lieux d'origine (Moscow / Moscou, Ireland / Irlande), journal.
- Changement de lieu au glisser plus tolérant : la page suit le doigt, change au-delà de 60 px ou sur un geste vif, et revient en place sinon. Le défilement vertical n'est plus gêné.
- La page de test `sonde.html` est en anglais.
- `?demo=` accepte aussi les mots anglais (`dusk,clear`, `noon,rain`…).

## 1.0.0 · 16/11/2026

Première version.

- Page web installable sur l'écran d'accueil de l'iPad, plein écran, portrait et paysage.
- Données Open-Meteo : instant présent, pluie par quart d'heure sur 3 h, 48 heures, 10 jours, qualité de l'air, pollens.
- Ciel animé piloté par la hauteur réelle du soleil au lieu affiché : nuit, aube, lever, jour, coucher, crépuscule ; soleil, lune à sa phase, étoiles, nuages, pluie, neige, grêle, éclairs, brouillard, relief propre à chaque lieu.
- Lieux gérés à la main (Dublin, Paris, Moscou au départ), glisser pour passer de l'un à l'autre.
- Avis calculés : gel, rafales, fortes pluies, neige, orage, chaleur, UV, air dégradé.
- Fonctionnement en station : rafraîchissement toutes les 10 min, tenue hors connexion, atténuation la nuit, défilement automatique, rechargement quotidien, écran de diagnostic et démonstration du ciel.
