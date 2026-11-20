/* Contrôles bloquants avant publication : syntaxe ES2017, API et CSS inconnues de Safari 12, astronomie, codes météo. */
'use strict';
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const DOCS = path.join(__dirname, '..', 'docs');
let errors = 0;
const fail = (m) => { errors++; console.log('  ✕ ' + m); };
const ok = (m) => console.log('  ✓ ' + m);

function files(dir, ext) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) out = out.concat(files(p, ext));
    else if (f.endsWith(ext)) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(DOCS, p);

/* Retire chaînes et commentaires pour ne pas confondre du texte avec du code. */
function stripJS(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
}

console.log('JavaScript (ES2017, API de Safari 12)');
// docs/socle : les fichiers diffusés par le socle (bannière d'installation), contrôlés comme les nôtres.
const jsFiles = files(path.join(DOCS, 'js'), '.js').concat([path.join(DOCS, 'sw.js')], files(path.join(DOCS, 'socle'), '.js'));
const inline = [];
for (const h of files(DOCS, '.html')) {
  const src = fs.readFileSync(h, 'utf8');
  const re = /<script>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(src))) inline.push([rel(h) + ' (script)', m[1]]);
}
const BANNED_JS = [
  [/\?\./, 'chaînage optionnel ?.'], [/\?\?/, 'opérateur ??'], [/\.at\(/, 'Array.prototype.at'],
  [/\.flatMap\(/, 'flatMap'], [/\.flat\(/, 'flat'], [/Object\.fromEntries/, 'Object.fromEntries'],
  [/\.replaceAll\(/, 'replaceAll'], [/\.matchAll\(/, 'matchAll'], [/allSettled/, 'Promise.allSettled'],
  [/Promise\.any/, 'Promise.any'], [/globalThis/, 'globalThis'], [/\bBigInt\b/, 'BigInt'],
  [/structuredClone/, 'structuredClone'], [/ResizeObserver/, 'ResizeObserver'], [/\.animate\(/, 'Element.animate'],
  [/RelativeTimeFormat/, 'Intl.RelativeTimeFormat'], [/ListFormat/, 'Intl.ListFormat'], [/wakeLock/, 'navigator.wakeLock'],
  [/AbortController/, 'AbortController'], [/\bimport\s*\(/, 'import()'], [/^\s*(import|export)\s/m, 'module ES'],
  [/\.padStart\(|\.padEnd\(/, 'padStart/padEnd (OK en 12, mais à éviter)'], [/new Date\(\s*['"]\d{4}-/, 'new Date(chaîne ISO)'],
  [/\.toSorted\(|\.findLast\(/, 'API récente de tableau'], [/\.hasOwn\(/, 'Object.hasOwn'],
  [/queueMicrotask/, 'queueMicrotask'], [/\.scrollTo\(\{/, 'scrollTo avec options']
];
for (const [name, src] of jsFiles.map((f) => [rel(f), fs.readFileSync(f, 'utf8')]).concat(inline)) {
  try {
    acorn.parse(src, { ecmaVersion: 2017, sourceType: 'script' });
  } catch (e) {
    fail(name + ' : syntaxe hors ES2017 · ' + e.message);
    continue;
  }
  const code = stripJS(src);
  let bad = false;
  for (const [re, label] of BANNED_JS) {
    if (re.test(code)) { fail(name + ' : ' + label); bad = true; }
  }
  if (!bad) ok(name);
}

console.log('CSS (propriétés de Safari 12)');
const cssSources = files(path.join(DOCS, 'css'), '.css').concat(files(path.join(DOCS, 'socle'), '.css')).map((f) => [rel(f), fs.readFileSync(f, 'utf8')]);
for (const h of files(DOCS, '.html')) {
  const src = fs.readFileSync(h, 'utf8');
  const re = /<style>([\s\S]*?)<\/style>/g;
  let m;
  while ((m = re.exec(src))) cssSources.push([rel(h) + ' (style)', m[1]]);
}
// Le CSS écrit depuis le JavaScript compte aussi.
for (const f of jsFiles) cssSources.push([rel(f) + ' (styles en ligne)', fs.readFileSync(f, 'utf8')]);
const BANNED_CSS = [
  [/(^|[;{\s])gap\s*:/m, 'gap (seul grid-gap est sûr)'], [/(^|[;{\s])(row|column)-gap\s*:/m, 'row-gap / column-gap'],
  [/(^|[;{\s])inset\s*:/m, 'inset'], [/\bclamp\(/, 'clamp()'], [/aspect-ratio/, 'aspect-ratio'],
  [/:is\(|:where\(|:has\(/, ':is / :where / :has'], [/:focus-visible/, ':focus-visible'],
  [/\d(dvh|svh|lvh)\b/, 'unités dvh/svh/lvh'], [/@container/, 'requête de conteneur'], [/color-mix\(/, 'color-mix()'],
  [/overscroll-behavior/, 'overscroll-behavior'], [/scroll-behavior/, 'scroll-behavior'],
  [/(^|[^-])backdrop-filter/m, 'backdrop-filter sans préfixe'], [/(^|[^-])mask-image/m, 'mask-image sans préfixe']
];
for (const [name, src] of cssSources) {
  // Dans le JavaScript : ni U.clamp ni le code GLSL du globe (ses clamp() sont du GLSL, pas du CSS).
  const code = name.endsWith('.js (styles en ligne)')
    ? src.replace(/var FS = \[[\s\S]*?\]\.join\('\\n'\);/, '').replace(/\.clamp\(/g, '.clampJS(')
    : src;
  let bad = false;
  for (const [re, label] of BANNED_CSS) {
    if (re.test(code)) { fail(name + ' : ' + label); bad = true; }
  }
  if (!bad && !name.endsWith('(styles en ligne)')) ok(name);
}
// Imbrication CSS : une accolade ouvrante à l'intérieur d'une règle ordinaire.
for (const [name, src] of cssSources.filter((c) => !c[0].endsWith('(styles en ligne)'))) {
  const body = src.replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];
  let last = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '{') {
      const sel = body.slice(last, i).trim();
      if (stack.length && !stack[stack.length - 1]) { fail(name + ' : imbrication CSS près de « ' + sel.slice(-40) + ' »'); break; }
      stack.push(/^@/.test(sel));
      last = i + 1;
    } else if (ch === '}') { stack.pop(); last = i + 1; }
    else if (ch === ';') last = i + 1;
  }
}

console.log('Astronomie (lever et coucher comparés à Open-Meteo)');
global.SM = {};
require(path.join(DOCS, 'js', 'astro.js'));
const astro = global.SM.astro;
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'astro-fixture.json'), 'utf8'));
for (const f of fixture) {
  const dayStart = f.day * 1000;
  const cr = astro.crossings(dayStart - 3600000, f.lat, f.lon, 26);
  const rise = cr.find((c) => c.rise), set = cr.find((c) => !c.rise);
  const dr = rise ? Math.abs(rise.t / 1000 - f.sunrise) / 60 : 999;
  const ds = set ? Math.abs(set.t / 1000 - f.sunset) / 60 : 999;
  if (dr <= 3 && ds <= 3) ok(f.name + ' : écart lever ' + dr.toFixed(1) + ' min, coucher ' + ds.toFixed(1) + ' min');
  else fail(f.name + ' : écart lever ' + dr.toFixed(1) + ' min, coucher ' + ds.toFixed(1) + ' min');
}
const ph = astro.moonPhase(Date.UTC(2026, 10, 24, 14, 0));
if (ph.fraction > 0.97) ok('pleine lune du 24/11/2026 : ' + Math.round(ph.fraction * 100) + ' %');
else fail('pleine lune du 24/11/2026 : ' + Math.round(ph.fraction * 100) + ' %');

console.log('Codes météo');
global.SM.i18n = { lang: 'fr' };
require(path.join(DOCS, 'js', 'codes.js'));
const iconsSrc = fs.readFileSync(path.join(DOCS, 'js', 'icons.js'), 'utf8');
const WMO = [0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99];
let codesOk = true;
for (const c of WMO) {
  const r = global.SM.codes.table[c];
  if (!r || !r[0] || !r[1]) { fail('code ' + c + ' sans libellé'); codesOk = false; continue; }
  for (const d of [1, 0]) {
    const key = global.SM.codes.icon(c, d);
    if (iconsSrc.indexOf("'" + key + "':") < 0) { fail('code ' + c + ' : icône « ' + key + ' » absente'); codesOk = false; }
  }
  if (['clear', 'cloud', 'fog', 'drizzle', 'rain', 'snow', 'storm', 'hail'].indexOf(r[3]) < 0) { fail('code ' + c + ' : scène inconnue'); codesOk = false; }
}
if (codesOk) ok(WMO.length + ' codes avec libellé, icônes jour et nuit, scène');

console.log('Version');
// Le contrôle est celui du socle (tools/version/monter.mjs, copie diffusée), piloté par
// version.config.json : le même numéro dans config.js, tous les ?v=, le cache de sw.js, la tête du
// journal et version.json.
const verif = require('child_process').spawnSync(process.execPath, [path.join(__dirname, 'version', 'monter.mjs'), '--verifier'], { encoding: 'utf8' });
if (verif.status === 0) ok(verif.stdout.trim()); else fail((verif.stdout || verif.stderr || 'contrôle de version en échec').trim());

console.log(errors ? '\n' + errors + ' problème(s)' : '\nTout est conforme.');
process.exit(errors ? 1 : 0);
