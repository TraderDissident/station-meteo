# Journal des modifications

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
