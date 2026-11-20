// MONTER LA VERSION · La seule façon de changer le numéro de Station Météo (Matt, 20/11/2026), sur le
// modèle de scripts/changelog/monter.mjs des sites du socle : plus aucun numéro écrit à la main.
//
//   node tools/monter.js --correctif -m "Ce qui change" [-m "…"]
//   node tools/monter.js --nouveaute -m "…"          (chiffre du milieu)
//
// 1. SM.VERSION dans docs/js/config.js ;
// 2. tous les ?v= de docs/index.html et docs/sw.js, et le nom du cache de sw.js ;
// 3. l'entrée « ## X.Y.Z · JJ/MM/AAAA » en tête de CHANGELOG.md, une puce par -m ;
// 4. docs/version.json (numéro et date), que Fleet Monitor lit en ligne.
//
// Il ne commite rien : tools/publier.sh contrôle, commite, pose l'étiquette vX.Y.Z et publie.
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const args = process.argv.slice(2);
const stop = function (m) { console.error('✗ ' + m); process.exit(1); };
const lignes = args.reduce(function (acc, a, i) { if (a === '-m' && args[i + 1]) acc.push(args[i + 1]); return acc; }, []);
const genre = ['--correctif', '--nouveaute', '--refonte'].filter(function (g) { return args.indexOf(g) >= 0; });
if (genre.length !== 1) stop('Dire une seule fois --correctif, --nouveaute ou --refonte.');
if (!lignes.length) stop('Il manque au moins un -m "Ce qui change".');

const lire = function (f) { return fs.readFileSync(path.join(RACINE, f), 'utf8'); };
const ecrire = function (f, t) { fs.writeFileSync(path.join(RACINE, f), t); };

const config = lire('docs/js/config.js');
const m = /SM\.VERSION = '(\d+)\.(\d+)\.(\d+)'/.exec(config);
if (!m) stop('docs/js/config.js : SM.VERSION introuvable.');
const ancienne = m[1] + '.' + m[2] + '.' + m[3];
let a = +m[1], b = +m[2], c = +m[3];
if (genre[0] === '--correctif') c += 1; else if (genre[0] === '--nouveaute') { b += 1; c = 0; } else { a += 1; b = 0; c = 0; }
const version = a + '.' + b + '.' + c;

const jour = new Date();
const deux = function (n) { return (n < 10 ? '0' : '') + n; };
const fr = deux(jour.getDate()) + '/' + deux(jour.getMonth() + 1) + '/' + jour.getFullYear();
const iso = jour.getFullYear() + '-' + deux(jour.getMonth() + 1) + '-' + deux(jour.getDate());

ecrire('docs/js/config.js', config.replace("SM.VERSION = '" + ancienne + "'", "SM.VERSION = '" + version + "'"));
['docs/index.html', 'docs/sw.js'].forEach(function (f) {
  ecrire(f, lire(f).split('?v=' + ancienne).join('?v=' + version).split("'sm-" + ancienne + "'").join("'sm-" + version + "'"));
});
const journal = lire('CHANGELOG.md');
const entree = '## ' + version + ' · ' + fr + '\n\n' + lignes.map(function (l) { return '- ' + l; }).join('\n') + '\n\n';
const premiere = journal.search(/^## /m);
ecrire('CHANGELOG.md', premiere < 0 ? journal.replace(/\s*$/, '\n\n') + entree : journal.slice(0, premiere) + entree + journal.slice(premiere));
ecrire('docs/version.json', JSON.stringify({ version: version, released: iso }) + '\n');
console.log('✓ version ' + version + ' écrite partout (était ' + ancienne + '). Publier : tools/publier.sh');
