# Journal des modifications

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
