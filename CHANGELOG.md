# Journal des modifications

## 1.21.7 · 17/11/2026

Signalé par Matt sur l'iPad : la plupart des changements de lieu sont rapides, mais certains mettent jusqu'à une seconde et demie. Le journal montre qu'ils arrivent quand deux glissements s'enchaînent à 1 à 4 secondes d'écart.

- Tant qu'un doigt glisse ou qu'un écran sort ou entre, tout le travail différé de l'écran en place attend : suite des heures, jours restants, détails, teinte des nuages, chargement des lieux voisins, vidage de l'ancien écran, et nouveau rendu à l'arrivée de données. Avant, ce travail pouvait tomber au milieu du geste suivant et le retarder.

## 1.21.6 · 17/11/2026

Signalé par Matt sur l'iPad après la 1.21.5 : le suivi du doigt est bon, mais au lâcher l'écran repasse un instant au centre avant de sortir.

- Sortie au lâcher : elle part maintenant de la position exacte où le doigt a laissé l'écran. Sa cible était en pourcentage alors que la position du doigt est en pixels ; Safari 12 ne sait pas passer de l'un à l'autre et repartait de zéro, c'est-à-dire du centre. La cible est en pixels, et l'état de départ est fixé avant de la poser.
- La classe d'animation d'entrée est retirée une fois l'entrée jouée, au lieu de rester sur l'écran au repos.

## 1.21.5 · 17/11/2026

Signalé par Matt sur l'iPad : au premier mouvement du doigt pour changer de lieu, les deux colonnes disparaissaient (il ne restait que le ciel et l'en-tête), puis réapparaissaient au lâcher.

- Cause, isolée par essais sur l'iPad : depuis la 1.21.4, la colonne de gauche avait sa propre couche. Safari 12 n'affiche plus les deux colonnes quand leur écran bouge ou devient translucide alors que l'une a une couche et que l'autre défile. La couche revient sur l'écran entier, comme en 1.21.3 (5 Mo de plus, essai validé à l'écran).

## 1.21.4 · 17/11/2026

D'après les mesures en paysage de la 1.21.2 (sous la pluie : 264 Mo ramenés à 163 Mo, 99,5 Mo de couches ramenés à 45,5 Mo).

- Écran d'un lieu en paysage : la couche permanente est celle de la colonne de gauche seule ; l'écran entier n'a plus de couche à lui (10 Mo à moitié vides). Le déplacer pendant un changement de lieu ne demande toujours aucune repeinte.
- Halos du soleil et de la lune : couches au quart de la taille, agrandies par la carte graphique (le soleil coûtait 2,6 Mo même presque invisible sous la pluie).
- Réglage d'essai, sans effet par défaut : SM.sky.setFxScale(0.5) dessine la pluie deux fois moins fin, pour mesurer sur l'iPad ce que sa finesse coûte en mémoire avant de décider.

## 1.21.3 · 17/11/2026

D'après la mesure sur l'iPad de 20 rafraîchissements d'une même ville : la mémoire montait de 2,3 Mo à chaque rafraîchissement, jusqu'à 46 Mo d'avance.

- Mémoire : un écran remplacé (rafraîchissement toutes les 15 min, changement de lieu, passage à la carte) est maintenant vidé tout de suite. Avant, il restait entier en mémoire tant que le code gardait une référence sur un de ses nœuds, ce que Safari ne lâche qu'à son ramasse-miettes suivant, parfois vingt rendus plus tard. Même traitement pour l'ancienne bande d'heures, et pour les points et les cartes de la carte du monde à chaque rafraîchissement.
- Carte du monde reconstruite alors qu'elle est affichée : l'ancien canevas et ses calques sont rendus tout de suite.

## 1.21.2 · 17/11/2026

D'après les mesures en paysage sur l'iPad : 264 Mo et 48 couches sous la pluie, contre 118 Mo par ciel clair.

- Mémoire des couches du ciel : la mémoire d'une couche suit sa taille affichée, pas celle de son canevas (mesuré : un nuage de 320 × 160 px affiché en 580 × 290 coûtait 2,7 Mo au lieu de 0,2 ; les deux canevas d'étoiles 8,7 Mo chacun ; la pluie 11 Mo). Chaque canevas a maintenant une couche à sa taille exacte en pixels d'écran, agrandie par la carte graphique : nuages (dans leur animation), étoiles, pluie. Même image à l'écran, puisqu'elle était déjà agrandie.
- Brouillard (aussi affiché par temps de bruine) : ses deux couches animées sont au quart de la taille et agrandies quatre fois dans leur animation (environ 24 Mo de moins).
- Changement de lieu : la pluie garde son image pendant que le nouvel écran se construit, et reprend quand il entre ; les deux lieux voisins se préchargent 3,5 s après l'arrivée au lieu de 2,5 s.

## 1.21.1 · 17/11/2026

D'après la deuxième série de mesures sur l'iPad (40 changements de ville enchaînés).

- Mémoire : une couche plein écran de 11 Mo en moins. body, en position fixe, peignait lui-même un fond et le dessin partagé des icônes, ce qui lui donnait une couche en double de la racine ; le fond est maintenant porté par html seul et le dessin des icônes vit dans #app (essai fait en direct sur l'iPad : la couche tombe à 0).
- Changement de lieu : le premier temps ne construit plus que ce qu'on voit à l'arrivée, soit 336 éléments au lieu de 820 (8 heures en paysage ou 11 en portrait, 4 jours) ; la suite arrive par tranches (heures, puis jours restants, puis détails, à 250 ms d'écart) au lieu d'un seul bloc de 180 à 200 ms.
- Pas de fuite mémoire : sur deux tours des 20 lieux, la mémoire plafonne dès la fin du premier tour (mesuré).

## 1.21.0 · 17/11/2026

D'après les mesures prises sur l'iPad (retour de Matt : l'animation de changement de ville commence, se fige une demi-seconde à une seconde, puis l'autre ville apparaît).

- Changement de lieu en trois temps : l'écran actuel s'en va tout de suite (glissement et fondu de 0,22 s faits par la carte graphique, fluides même pendant que la page travaille) ; le nouvel écran est construit, posé et peint, presque invisible ; il n'entre qu'une fois prêt. Avant, tout était construit au lâcher du doigt, l'ancien écran figé à mi-course.
- Les données météo qui arrivent pendant le changement n'interrompent plus l'animation : le rafraîchissement attend sa fin.
- La suite de l'écran (heures 13 à 48, détails) est construite après l'entrée, plus pendant.
- Plus de règle universelle sur ::before et ::after : elle faisait calculer deux pseudo-éléments pour chacun des 1 700 éléments à chaque construction d'écran (plus de 10 000 créés et détruits en quelques changements de ville, mesuré sur l'iPad). Seuls les pseudo-éléments réellement utilisés la reçoivent.
- Le ciel est réglé avant la construction de l'écran : la teinte des cartes n'est plus calculée deux fois.
- La teinte des nuages se repeint après le changement de lieu, un nuage à la fois.
- Journal : la ligne « show » donne l'attente avant construction, le ciel, l'écran et le délai jusqu'à l'affichage.

## 1.20.2 · 17/11/2026

- Diagnostic à distance : le rapport (état de l'appareil et journal) est aussi rangé dans le cache du site (« sm-diag / diag-report »), 10 s après l'ouverture, toutes les 5 min et quelques secondes après un gel. L'outil de diagnostic branché en USB peut le lire à travers le service worker, sans copie à la main. Rien ne sort de l'appareil.
- Journal : chaque point de situation donne aussi le nombre de canevas et leur surface totale, et le nombre de couches du ciel et de nuages montrés.

## 1.20.1 · 17/11/2026

- Journal : la ligne « FROZEN » dit maintenant si l'iPad lui-même dormait ou si seule la page était arrêtée (comparaison de l'heure murale et de l'horloge monotone, qui s'arrête quand l'appareil dort), et note si la page avait le focus et le réseau.
- Après un gel de plus d'une minute, l'heure, le voile de nuit et la météo repartent tout de suite ; pendant trois minutes, la requête météo n'attend que 7 s et réessaie 4 s plus tard (avant : 20 s d'attente puis 30 s, d'où « hors connexion » pendant près d'une minute au réveil).

## 1.20.0 · 17/11/2026

Passe complète sur la rapidité, sans toucher à l'apparence ni aux animations.

- Changement de lieu : les nuages ne sont plus recréés (13 canevas et leurs règles d'animation créés une fois par taille d'écran, puis seulement réglés : nombre, hauteur, vitesse, sens) ; la feuille de style n'est plus réécrite (cela faisait recalculer le style de toute la page) ; l'écran d'un lieu garde sa propre couche (plus de repeinte entière au début du glissement ni à la fin de l'animation d'arrivée) ; les détails sont construits au second temps, avec les heures 13 à 48 ; une seule mise en page forcée au lieu de deux.
- Ciel : les couches invisibles sortent de l'affichage après leur fondu (brouillard et ses deux animations permanentes, étoiles et leur scintillement, voile nuageux, soleil, lune, canevas de pluie) ; le dégradé du ciel et le voile nuageux sont peints au quart de la taille puis agrandis par la carte graphique (seize fois moins à peindre, environ 25 Mo de moins) ; même ciel qu'au dernier passage (la nuit, pendant des heures) : ni repeinte ni fondu toutes les 30 s ; teinte des nuages repeinte par pas, plus à chaque changement infime du crépuscule.
- Cartes et cadran : leur teinte ne change plus que par pas de 0,01 (chaque changement faisait repeindre toutes les cartes) ; la ligne « Mis à jour à » n'est réécrite que si elle change ; sans les secondes, l'horloge ne travaille qu'une fois par minute.
- Démarrage et réseau : seuls les deux lieux voisins se chargent en arrière-plan (avant : les 20 lieux, soit 40 requêtes pendant qu'on se servait de l'app) ; les autres se chargent en les approchant, ou tous à l'ouverture de la carte du monde.
- Carte du monde : un rafraîchissement au plus toutes les 1,5 s pendant le chargement des lieux (avant : un par lieu) ; entre deux minutes, plus aucun calcul si aucune horloge n'est à l'écran (avant : l'heure des 20 lieux recalculée chaque seconde) ; premier placement des étiquettes 2,5 fois plus court.
- Globe : les points et leurs étiquettes sont déplacés par la carte graphique (avant : 30 mises en page par seconde) ; anticrénelage inutile retiré ; si l'appareil ne tient pas 18 images par seconde, le globe est dessiné moins fin pour rester fluide.
- Les données d'un lieu rendu sur l'écran ne déclenchent plus de second remplissage inutile de la carte horaire.

## 1.19.1 · 17/11/2026

- Changement de lieu allégé : la carte horaire ne construit d'abord que 12 heures au lieu de 48 (840 éléments à l'écran au lieu de 1 900), le reste arrive une seconde plus tard, sans toucher au défilement en cours.
- Journal : chaque changement de lieu est chronométré (calcul de l'écran, ciel, délai jusqu'à l'affichage réel), pour mesurer la lenteur sur l'iPad lui-même.

## 1.19.0 · 17/11/2026

- Vrai journal : gardé 7 jours (4 000 lignes au plus), ouvert en plein écran depuis Diagnostic, avec Copier (tout le journal et l'état de l'appareil dans le presse-papiers), Vider et Fermer ; avertissements en jaune, erreurs en rouge.
- Le journal note maintenant chaque météo reçue ou ratée avec sa durée, la page masquée, montrée, mise en veille ou réveillée par le système, le réseau qui tombe ou revient, le voile de nuit, les changements de lieu et de vue, les recherches de mise à jour, le premier toucher après un long silence, un point de situation par heure, et tout gel de plus de 6 s avec son heure de début et sa durée.

## 1.18.3 · 17/11/2026

- Mémoire : les images des nuages sont rendues tout de suite quand le ciel les recrée (à chaque changement de vent, donc à peu près à chaque rafraîchissement). Piste du blocage nocturne de l'iPad, pas encore prouvée.
- « Hors connexion » ne s'affiche plus que si l'appareil est vraiment hors ligne ; une requête météo ratée affiche « Météo injoignable, nouvel essai ».

## 1.18.2 · 17/11/2026

- Diagnostic : boîte noire pour les blocages. Toutes les 30 s l'app note qu'elle vit (heure, écran affiché, dernière météo reçue) ; au démarrage suivant, si elle s'était arrêtée sans fermeture propre, le journal donne l'heure de l'arrêt et ce qui était affiché. Un blocage de plus de 6 s à l'écran est noté avec sa durée.

## 1.18.1 · 17/11/2026

- Globe : toutes les étiquettes restent affichées (avant, celles qui en recouvraient une autre disparaissaient), et elles se placent à la main comme sur la carte : on les glisse, Maj cale le trait à 45°, la place est retenue par ville, en proportion du rayon du globe, et l'étiquette tourne avec son point. Reposée sur son point, elle revient à droite de lui.

## 1.18.0 · 17/11/2026

- Globe : lecture / pause de la rotation, comme sur la carte de Travel Hub. Pastille en bas à gauche du globe, avec les boutons lecture et pause (celui actif en blanc) ; à la souris, la vitesse 0,5×, 1×, 1,5× ou 2× se déplie au survol. Choix retenus d'une ouverture à l'autre.
- Globe : la rotation ne s'arrête que pendant qu'on le tient, et reprend dès qu'on le lâche (avant : 20 s plus tard).

## 1.17.0 · 17/11/2026

- Lieux : ordre réglé par glisser-déposer. Chaque lieu a une poignée ≡ à droite ; on l'attrape au doigt ou à la souris, la ligne suit, les autres s'écartent, et la liste défile quand on approche du haut ou du bas. Les boutons monter et descendre sont retirés.

## 1.16.4 · 17/11/2026

- Carte en plein écran : centrée sur l'écran entier (145 px au-dessus, 144 px au-dessous sur l'iPad en paysage) au lieu de l'espace sous l'en-tête, qui la faisait paraître trop basse.

## 1.16.3 · 17/11/2026

- Carte en plein écran : les boutons de l'en-tête restent (lieux, réglages de la carte, plein écran en blanc quand il est actif, globe, réglages) ; seules les cartes de villes disparaissent. Le bouton de sortie posé sur la carte est retiré, le bouton de l'en-tête suffit.
- Le plein écran est retenu d'une ouverture de l'app à l'autre.

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
