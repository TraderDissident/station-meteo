/* Station Météo · réglages fixes. Code limité à ES2017 (Safari 12). */
var SM = window.SM || {};
window.SM = SM;

SM.VERSION = '1.2.0';

SM.DEFAULT_PLACES = [
  { id: 'dublin', name: 'Dublin', region: 'Leinster', country: 'Ireland', lat: 53.33306, lon: -6.24889, tz: 'Europe/Dublin',
    names: { en: ['Dublin', 'Leinster', 'Ireland'], fr: ['Dublin', 'Leinster', 'Irlande'] } },
  { id: 'paris', name: 'Paris', region: 'Île-de-France', country: 'France', lat: 48.85341, lon: 2.3488, tz: 'Europe/Paris',
    names: { en: ['Paris', 'Île-de-France', 'France'], fr: ['Paris', 'Île-de-France', 'France'] } },
  { id: 'moscou', name: 'Moscow', region: 'Moscow', country: 'Russia', lat: 55.75204, lon: 37.61781, tz: 'Europe/Moscow',
    names: { en: ['Moscow', 'Moscow', 'Russia'], fr: ['Moscou', 'Moscou', 'Russie'] } }
];

SM.DEFAULT_SETTINGS = {
  carousel: 0,          // secondes entre deux lieux, 0 = arrêté
  veil: 'hours',        // 'off' | 'auto' (nuit au lieu de démarrage) | 'hours'
  veilFrom: 23,
  veilTo: 7,
  veilLevel: 0.55,
  motion: 'auto',       // 'auto' | 'reduced' | 'off'
  seconds: false,
  lang: 'en'            // 'en' | 'fr' | 'auto' (langue de l'iPad)
};

SM.REFRESH_MS = 10 * 60 * 1000;
SM.AIR_REFRESH_MS = 30 * 60 * 1000;
SM.STALE_BADGE_MS = 60 * 60 * 1000;
SM.STALE_DATA_MS = 3 * 60 * 60 * 1000;
