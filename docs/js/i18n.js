/* Textes français et anglais, nombres, heures du lieu affiché. */
(function () {
  var T = {
    fr: {
      days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
      daysShort: ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'],
      months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
      today: 'Aujourd’hui', todayShort: 'Auj.', tomorrow: 'Demain', now: 'Maint.',
      feels: 'Ressenti', max: 'Max', min: 'Min', precip: 'Précip.', chance: 'Risque',
      gusts: 'rafales', wind: 'Vent', humidity: 'Humidité', dew: 'Point de rosée', pressure: 'Pression',
      visibility: 'Visibilité', uv: 'Indice UV', clouds: 'Nuages', sun: 'Soleil', moon: 'Lune',
      air: 'Qualité de l’air', pollen: 'Pollens', rainTotal: 'Précipitations',
      sunrise: 'Lever', sunset: 'Coucher', daylight: 'Durée du jour', tomorrowShort: 'demain',
      next3h: 'Pluie dans les 3 heures', hourly: 'Heure par heure', daily: '10 jours', details: 'Détails', openLog: 'Ouvrir le journal', logTitle: 'Journal', logKept: '7 jours gardés', copy: 'Copier', copied: 'Copié', copyFailed: 'Copie impossible', rotPlay: 'Faire tourner le globe', rotPause: 'Arrêter le globe', reorder: 'Glisser pour déplacer', tpHours: 'Heures', tpMinutes: 'Minutes', tpNow: 'Maintenant', hvCond: 'Conditions météo', hvPrecip: 'Précipitations', hvWind: 'Vent', hvCondSub: 'Température (°C)', hvPrecipSub: 'Intensité · Risque de pluie', hvWindSub: 'Vitesse (km/h) · Rafales', edit: 'Modifier', done: 'Terminé', editMode: 'Mode édition', editHint: 'glissez les blocs pour les réordonner, − pour en retirer.', addTiles: 'Ajouter', removeTile: 'Retirer',
      rising: 'en hausse', falling: 'en baisse', steady: 'stable',
      uvLevels: ['faible', 'modéré', 'élevé', 'très élevé', 'extrême'],
      airLevels: ['bon', 'correct', 'moyen', 'médiocre', 'mauvais', 'très mauvais'],
      pollenLevels: ['nul', 'faible', 'moyen', 'fort', 'très fort'],
      alder: 'Aulne', birch: 'Bouleau', grass: 'Graminées',
      dirs: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'],
      moonPhases: ['Nouvelle lune', 'Premier croissant', 'Premier quartier', 'Lune gibbeuse croissante', 'Pleine lune', 'Lune gibbeuse décroissante', 'Dernier quartier', 'Dernier croissant'],
      illuminated: 'éclairée',
      today24: 'aujourd’hui', next24: 'sur 24 h',
      updated: 'Mis à jour à', stale: 'Données anciennes', offline: 'Hors connexion', retrying: 'Météo injoignable, nouvel essai', loading: 'Chargement…',
      noData: 'Pas encore de données pour ce lieu.', retry: 'Réessayer',
      rainNow: function (until) { return until ? 'Pluie jusqu’à ' + until : 'Pluie pendant les 3 prochaines heures'; },
      snowNow: function (until) { return until ? 'Neige jusqu’à ' + until : 'Neige pendant les 3 prochaines heures'; },
      rainSoon: function (kind, min) { return kind + ' dans ' + min + ' min'; },
      rainLater: function (kind, when) { return kind + ' probable ' + when; },
      dry: 'Pas de pluie prévue dans les 12 heures',
      intensities: { rain: ['Pluie faible', 'Pluie modérée', 'Forte pluie'], snow: ['Neige faible', 'Neige modérée', 'Forte neige'] },
      at: function (t) { return 'à ' + t; },
      towards: function (t) { return 'vers ' + t; },
      tomorrowAt: function (t) { return 'demain vers ' + t; },
      dayAt: function (d, t) { return d + ' vers ' + t; },
      alerts: {
        frost: function (v, w) { return 'Gel, jusqu’à ' + v + ' ' + w; },
        gust: function (v, w) { return 'Rafales à ' + v + ' km/h ' + w; },
        rain: function (v, w) { return 'Fortes pluies, ' + v + ' mm/h ' + w; },
        rainDay: function (v) { return 'Fortes pluies, ' + v + ' mm sur 24 h'; },
        snow: function (v, w) { return 'Neige, ' + v + ' cm en 24 h, dès ' + w; },
        storm: function (w) { return 'Orage possible ' + w; },
        heat: function (v, w) { return 'Forte chaleur, ' + v + ' ' + w; },
        uv: function (v, w) { return 'UV élevé (' + v + ') ' + w; },
        air: function (v, l) { return 'Air ' + l + ' (indice ' + v + ')'; }
      },
      places: 'Lieux', settings: 'Réglages', search: 'Rechercher une ville', add: 'Ajouter', remove: 'Supprimer',
      startHere: 'Lieu de démarrage', done: 'Terminé', noResult: 'Aucun résultat', searching: 'Recherche…',
      added: 'Ajouté', alreadyThere: 'Déjà dans la liste', lastPlace: 'Il faut garder au moins un lieu',
      carousel: 'Défilement des lieux', off: 'Arrêté', every: function (s) { return s < 60 ? s + ' s' : (s / 60) + ' min'; },
      veil: 'Atténuation la nuit', auto: 'Automatique', hours: 'Horaires', from: 'de', to: 'à', level: 'Assombrissement de l’écran la nuit', lighter: 'Plus clair', darker: 'Plus sombre',
      motion: 'Animations', reduced: 'Réduites', motionOff: 'Coupées',
      seconds: 'Secondes sur l’horloge', yes: 'Oui', no: 'Non', language: 'Langue',
      about: 'À propos', source: 'Données météo : Open-Meteo.com (licence CC BY 4.0)', diagnostic: 'Diagnostic',
      version: 'Version', clearLog: 'Vider le journal', demo: 'Démonstration', demoTime: 'Moment', demoWeather: 'Temps',
      demoCycle: 'Journée en 60 s', demoStop: 'Arrêter la démonstration', reload: 'Recharger', forceUpdate: 'Forcer la mise à jour', latest: 'En ligne :', checking: 'Recherche de la version en ligne…', upToDate: 'C’est la dernière version.', onlineUnknown: 'Version en ligne inconnue (hors connexion).',
      veilHint: 'Touchez l’écran pour rallumer',
      badge: 'DÉMO', close: 'Fermer', worldMap: 'Carte du monde', allPlaces: 'Tous les lieux', dotBlink: 'Clignotement', dotTemp: 'Couleur de la température', clocks: 'Horloges', weatherCards: 'Météo',
      mapStyles: { nature: 'Nature', satellite: 'Satellite', flat: 'Épuré', atlas: 'Atlas', neon: 'Néon' }, viewMap: 'Carte', viewGlobe: 'Globe',
      yesterday: 'Hier', sameTime: 'même heure', mapCredit: 'Natural Earth · images NASA Blue Marble et VIIRS · jour et nuit calculés à la minute', hourOpt: function (h) { return h + ' h'; },
      diag: { version: 'Version', browser: 'Navigateur', screen: 'Écran', window: 'fenêtre', home: 'Écran d’accueil',
        anim: 'Animation', fps: 'i/s', quality: 'qualité', lastCall: 'Dernier appel', network: 'Réseau',
        online: 'en ligne', offline: 'hors ligne', uptime: 'Allumé depuis', errors: 'Erreurs', motion: { auto: 'auto', reduced: 'réduites', off: 'coupées' } },
      demoTimes: { nuit: 'Nuit', aube: 'Aube', lever: 'Lever', matin: 'Matin', midi: 'Midi', soir: 'Soir', coucher: 'Coucher', crepuscule: 'Crépuscule' },
      demoWeathers: { reel: 'Réel', clair: 'Clair', voile: 'Voilé', nuageux: 'Nuageux', couvert: 'Couvert', brouillard: 'Brouillard', bruine: 'Bruine', pluie: 'Pluie', averse: 'Averses', orage: 'Orage', neige: 'Neige', grele: 'Grêle' }
    },
    en: {
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      today: 'Today', todayShort: 'Today', tomorrow: 'Tomorrow', now: 'Now',
      feels: 'Feels like', max: 'Max', min: 'Min', precip: 'Precip.', chance: 'Chance',
      gusts: 'gusts', wind: 'Wind', humidity: 'Humidity', dew: 'Dew point', pressure: 'Pressure',
      visibility: 'Visibility', uv: 'UV index', clouds: 'Cloud cover', sun: 'Sun', moon: 'Moon',
      air: 'Air quality', pollen: 'Pollen', rainTotal: 'Precipitation',
      sunrise: 'Sunrise', sunset: 'Sunset', daylight: 'Daylight', tomorrowShort: 'tomorrow',
      next3h: 'Rain in the next 3 hours', hourly: 'Hourly', daily: '10 days', details: 'Details', openLog: 'Open log', logTitle: 'Log', logKept: '7 days kept', copy: 'Copy', copied: 'Copied', copyFailed: 'Copy failed', rotPlay: 'Spin the globe', rotPause: 'Stop the globe', reorder: 'Drag to move', tpHours: 'Hours', tpMinutes: 'Minutes', tpNow: 'Now', hvCond: 'Conditions', hvPrecip: 'Precipitation', hvWind: 'Wind', hvCondSub: 'Temperature (°C)', hvPrecipSub: 'Intensity · Chance of rain', hvWindSub: 'Speed (km/h) · Gusts', edit: 'Edit', done: 'Done', editMode: 'Edit mode', editHint: 'drag the blocks to reorder them, − to remove one.', addTiles: 'Add', removeTile: 'Remove',
      rising: 'rising', falling: 'falling', steady: 'steady',
      uvLevels: ['low', 'moderate', 'high', 'very high', 'extreme'],
      airLevels: ['good', 'fair', 'moderate', 'poor', 'very poor', 'extremely poor'],
      pollenLevels: ['none', 'low', 'moderate', 'high', 'very high'],
      alder: 'Alder', birch: 'Birch', grass: 'Grass',
      dirs: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
      moonPhases: ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'],
      illuminated: 'illuminated',
      today24: 'today', next24: 'next 24 h',
      updated: 'Updated at', stale: 'Old data', offline: 'Offline', retrying: 'Weather unreachable, retrying', loading: 'Loading…',
      noData: 'No data for this place yet.', retry: 'Retry',
      rainNow: function (until) { return until ? 'Rain until ' + until : 'Rain for the next 3 hours'; },
      snowNow: function (until) { return until ? 'Snow until ' + until : 'Snow for the next 3 hours'; },
      rainSoon: function (kind, min) { return kind + ' in ' + min + ' min'; },
      rainLater: function (kind, when) { return kind + ' likely ' + when; },
      dry: 'No rain expected in the next 12 hours',
      intensities: { rain: ['Light rain', 'Moderate rain', 'Heavy rain'], snow: ['Light snow', 'Moderate snow', 'Heavy snow'] },
      at: function (t) { return 'at ' + t; },
      towards: function (t) { return 'around ' + t; },
      tomorrowAt: function (t) { return 'tomorrow around ' + t; },
      dayAt: function (d, t) { return d + ' around ' + t; },
      alerts: {
        frost: function (v, w) { return 'Frost, down to ' + v + ' ' + w; },
        gust: function (v, w) { return 'Gusts of ' + v + ' km/h ' + w; },
        rain: function (v, w) { return 'Heavy rain, ' + v + ' mm/h ' + w; },
        rainDay: function (v) { return 'Heavy rain, ' + v + ' mm over 24 h'; },
        snow: function (v, w) { return 'Snow, ' + v + ' cm in 24 h, from ' + w; },
        storm: function (w) { return 'Thunderstorm possible ' + w; },
        heat: function (v, w) { return 'Heat, ' + v + ' ' + w; },
        uv: function (v, w) { return 'High UV (' + v + ') ' + w; },
        air: function (v, l) { return 'Air quality ' + l + ' (index ' + v + ')'; }
      },
      places: 'Places', settings: 'Settings', search: 'Search for a city', add: 'Add', remove: 'Remove',
      startHere: 'Start place', done: 'Done', noResult: 'No result', searching: 'Searching…',
      added: 'Added', alreadyThere: 'Already in the list', lastPlace: 'At least one place is needed',
      carousel: 'Cycle through places', off: 'Off', every: function (s) { return s < 60 ? s + ' s' : (s / 60) + ' min'; },
      veil: 'Dim at night', auto: 'Automatic', hours: 'Schedule', from: 'from', to: 'to', level: 'How dark the screen gets at night', lighter: 'Lighter', darker: 'Darker',
      motion: 'Animations', reduced: 'Reduced', motionOff: 'Off',
      seconds: 'Seconds on the clock', yes: 'Yes', no: 'No', language: 'Language',
      about: 'About', source: 'Weather data: Open-Meteo.com (CC BY 4.0 licence)', diagnostic: 'Diagnostics',
      version: 'Version', clearLog: 'Clear log', demo: 'Demo', demoTime: 'Time of day', demoWeather: 'Weather',
      demoCycle: 'A day in 60 s', demoStop: 'Stop demo', reload: 'Reload', forceUpdate: 'Force update', latest: 'Online:', checking: 'Checking the online version…', upToDate: 'This is the latest version.', onlineUnknown: 'Online version unknown (offline).',
      veilHint: 'Touch the screen to brighten',
      badge: 'DEMO', close: 'Close', worldMap: 'World map', allPlaces: 'All places', dotBlink: 'Blinking', dotTemp: 'Temperature colour', clocks: 'Clocks', weatherCards: 'Weather',
      mapStyles: { nature: 'Nature', satellite: 'Satellite', flat: 'Flat', atlas: 'Atlas', neon: 'Neon' }, viewMap: 'Map', viewGlobe: 'Globe',
      yesterday: 'Yesterday', sameTime: 'same time', mapCredit: 'Natural Earth · NASA Blue Marble and VIIRS imagery · day and night computed every minute', hourOpt: function (h) { return (h < 10 ? '0' : '') + h + ':00'; },
      diag: { version: 'Version', browser: 'Browser', screen: 'Screen', window: 'window', home: 'Home screen',
        anim: 'Animation', fps: 'fps', quality: 'quality', lastCall: 'Last request', network: 'Network',
        online: 'online', offline: 'offline', uptime: 'Running for', errors: 'Errors', motion: { auto: 'auto', reduced: 'reduced', off: 'off' } },
      demoTimes: { nuit: 'Night', aube: 'Dawn', lever: 'Sunrise', matin: 'Morning', midi: 'Noon', soir: 'Evening', coucher: 'Sunset', crepuscule: 'Dusk' },
      demoWeathers: { reel: 'Real', clair: 'Clear', voile: 'Hazy', nuageux: 'Cloudy', couvert: 'Overcast', brouillard: 'Fog', bruine: 'Drizzle', pluie: 'Rain', averse: 'Showers', orage: 'Storm', neige: 'Snow', grele: 'Hail' }
    }
  };

  var I = { lang: 'fr' };

  I.setLang = function (pref) {
    var sys = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    I.lang = pref === 'fr' || pref === 'en' ? pref : (sys.indexOf('fr') === 0 ? 'fr' : 'en');
    document.documentElement.lang = I.lang;
  };
  I.t = function () { return T[I.lang]; };

  /* Nom, région et pays d'un lieu dans la langue affichée (lieux d'origine), sinon tels qu'enregistrés. */
  I.place = function (p) {
    var n = p.names && p.names[I.lang];
    return n ? { name: n[0], region: n[1], country: n[2] } : { name: p.name, region: p.region || '', country: p.country || '' };
  };

  /* Nombres : virgule décimale en français, vrai signe moins. */
  I.num = function (v, dec) {
    if (!SM.U.has(v)) return '–';
    var s = (dec ? v.toFixed(dec) : String(Math.round(v)));
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    if (I.lang === 'fr') s = s.replace('.', ',');
    return s.replace('-', '−');
  };
  I.temp = function (v) { return I.num(v) + '°'; };
  I.mm = function (v) {
    if (!SM.U.has(v)) return '–';
    return (v > 0 && v < 0.1 ? I.num(0.1, 1) : (v < 10 ? I.num(v, 1) : I.num(v))) + ' mm';
  };
  I.dir = function (deg) { return I.t().dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]; };

  /* Heure murale du lieu : Intl avec le fuseau, sinon décalage fixe. */
  var fmtCache = {};
  function formatter(tz) {
    if (fmtCache[tz] !== undefined) return fmtCache[tz];
    var f = null;
    try {
      f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' });
      if (!f.formatToParts) f = null;
    } catch (e) { f = null; }
    fmtCache[tz] = f;
    return f;
  }
  var WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  /* Renvoie { y, mo (0-11), d, h, mi, s, wd, key } pour un instant Unix (s) dans un fuseau. */
  I.wall = function (unix, tz, offset) {
    var f = tz ? formatter(tz) : null;
    if (f) {
      var o = {};
      f.formatToParts(new Date(unix * 1000)).forEach(function (p) { o[p.type] = p.value; });
      var h = parseInt(o.hour, 10) % 24;
      var r = { y: +o.year, mo: +o.month - 1, d: +o.day, h: h, mi: +o.minute, s: +o.second, wd: WD[o.weekday] };
      r.key = r.y * 10000 + r.mo * 100 + r.d;
      return r;
    }
    var dt = new Date((unix + (offset || 0)) * 1000);
    var q = { y: dt.getUTCFullYear(), mo: dt.getUTCMonth(), d: dt.getUTCDate(), h: dt.getUTCHours(), mi: dt.getUTCMinutes(), s: dt.getUTCSeconds(), wd: dt.getUTCDay() };
    q.key = q.y * 10000 + q.mo * 100 + q.d;
    return q;
  };

  I.hm = function (w) { return SM.U.pad(w.h) + ':' + SM.U.pad(w.mi); };
  I.hOnly = function (w) { return I.lang === 'fr' ? w.h + ' h' : SM.U.pad(w.h) + ':00'; };
  I.longDate = function (w) {
    var t = I.t();
    return I.lang === 'fr'
      ? t.days[w.wd] + ' ' + w.d + ' ' + t.months[w.mo]
      : t.days[w.wd] + ' ' + w.d + ' ' + t.months[w.mo];
  };
  I.duration = function (sec) {
    var m = Math.round(sec / 60);
    return Math.floor(m / 60) + ' h ' + SM.U.pad(m % 60);
  };

  /* « à 18:00 », « demain vers 6 h », « jeudi vers 15 h » vu depuis maintenant. */
  I.when = function (unix, nowUnix, tz, offset) {
    var t = I.t();
    var w = I.wall(unix, tz, offset);
    var n = I.wall(nowUnix, tz, offset);
    var hh = I.hOnly(w);
    if (w.key === n.key) return t.towards(hh);
    var tomorrow = I.wall(nowUnix + 86400, tz, offset);
    if (w.key === tomorrow.key) return t.tomorrowAt(hh);
    return t.dayAt(t.days[w.wd], hh);
  };

  SM.i18n = I;
})();
