/* Station Météo · réglages fixes. Code limité à ES2017 (Safari 12). */
var SM = window.SM || {};
window.SM = SM;

SM.VERSION = '1.0.0';

SM.DEFAULT_PLACES = [
  { id: 'dublin', name: 'Dublin', region: 'Leinster', country: 'Irlande', lat: 53.33306, lon: -6.24889, tz: 'Europe/Dublin' },
  { id: 'paris', name: 'Paris', region: 'Île-de-France', country: 'France', lat: 48.85341, lon: 2.3488, tz: 'Europe/Paris' },
  { id: 'moscou', name: 'Moscou', region: 'Moscou', country: 'Russie', lat: 55.75204, lon: 37.61781, tz: 'Europe/Moscow' }
];

SM.DEFAULT_SETTINGS = {
  carousel: 0,          // secondes entre deux lieux, 0 = arrêté
  veil: 'hours',        // 'off' | 'auto' (nuit au lieu de démarrage) | 'hours'
  veilFrom: 23,
  veilTo: 7,
  veilLevel: 0.55,
  motion: 'auto',       // 'auto' | 'reduced' | 'off'
  seconds: false,
  lang: 'auto'          // 'auto' | 'fr' | 'en'
};

SM.REFRESH_MS = 10 * 60 * 1000;
SM.AIR_REFRESH_MS = 30 * 60 * 1000;
SM.STALE_BADGE_MS = 60 * 60 * 1000;
SM.STALE_DATA_MS = 3 * 60 * 60 * 1000;
