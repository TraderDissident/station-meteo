/* Codes météo WMO : libellé, icône, scène du ciel. */
(function () {
  // code: [français, anglais, icône, scène, intensité 0-3, couverture nuageuse par défaut]
  var C = {
    0: ['Ciel dégagé', 'Clear sky', 'clear', 'clear', 0, 0],
    1: ['Peu nuageux', 'Mainly clear', 'few', 'clear', 0, 20],
    2: ['Partiellement nuageux', 'Partly cloudy', 'partly', 'cloud', 0, 50],
    3: ['Couvert', 'Overcast', 'overcast', 'cloud', 0, 100],
    45: ['Brouillard', 'Fog', 'fog', 'fog', 1, 100],
    48: ['Brouillard givrant', 'Freezing fog', 'fog', 'fog', 2, 100],
    51: ['Bruine légère', 'Light drizzle', 'drizzle', 'drizzle', 1, 90],
    53: ['Bruine', 'Drizzle', 'drizzle', 'drizzle', 2, 95],
    55: ['Bruine dense', 'Dense drizzle', 'drizzle', 'drizzle', 3, 100],
    56: ['Bruine verglaçante', 'Freezing drizzle', 'sleet', 'drizzle', 1, 95],
    57: ['Bruine verglaçante dense', 'Dense freezing drizzle', 'sleet', 'drizzle', 2, 100],
    61: ['Pluie faible', 'Light rain', 'rain', 'rain', 1, 95],
    63: ['Pluie', 'Rain', 'rain', 'rain', 2, 100],
    65: ['Forte pluie', 'Heavy rain', 'heavyrain', 'rain', 3, 100],
    66: ['Pluie verglaçante', 'Freezing rain', 'sleet', 'rain', 1, 100],
    67: ['Forte pluie verglaçante', 'Heavy freezing rain', 'sleet', 'rain', 3, 100],
    71: ['Neige faible', 'Light snow', 'snow', 'snow', 1, 95],
    73: ['Neige', 'Snow', 'snow', 'snow', 2, 100],
    75: ['Forte neige', 'Heavy snow', 'heavysnow', 'snow', 3, 100],
    77: ['Grains de neige', 'Snow grains', 'snow', 'snow', 1, 100],
    80: ['Averses faibles', 'Light showers', 'showers', 'rain', 1, 70],
    81: ['Averses', 'Showers', 'showers', 'rain', 2, 80],
    82: ['Violentes averses', 'Violent showers', 'heavyrain', 'rain', 3, 90],
    85: ['Averses de neige', 'Snow showers', 'snowshowers', 'snow', 1, 75],
    86: ['Fortes averses de neige', 'Heavy snow showers', 'heavysnow', 'snow', 3, 90],
    95: ['Orage', 'Thunderstorm', 'storm', 'storm', 2, 100],
    96: ['Orage avec grêle', 'Thunderstorm with hail', 'hail', 'hail', 2, 100],
    99: ['Orage avec forte grêle', 'Thunderstorm with heavy hail', 'hail', 'hail', 3, 100]
  };

  function nearest(code) {
    if (C[code]) return C[code];
    var keys = Object.keys(C).map(Number).filter(function (k) { return k <= code; });
    return C[keys.length ? keys[keys.length - 1] : 0];
  }

  SM.codes = {
    table: C,
    label: function (code) { var r = nearest(code); return SM.i18n.lang === 'fr' ? r[0] : r[1]; },
    icon: function (code, isDay) {
      var r = nearest(code), k = r[2];
      if (k === 'clear' || k === 'few' || k === 'partly' || k === 'showers' || k === 'snowshowers') return k + (isDay ? '-day' : '-night');
      return k;
    },
    scene: function (code) { var r = nearest(code); return { kind: r[3], level: r[4], cover: r[5] }; },
    isSnow: function (code) { return (code >= 71 && code <= 77) || code === 85 || code === 86; },
    isWet: function (code) { return code >= 51; }
  };
})();
