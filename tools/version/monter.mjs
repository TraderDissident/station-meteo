// MONTER LA VERSION · La seule façon de changer le numéro d'une app (Matt, 20/11/2026). Une commande
// fait tout, pour que plus aucun numéro ne s'écrive à la main et ne reste en arrière :
//
//   node scripts/changelog/monter.mjs --correctif --titre "Rubrique · Ce qui change" -m "Une ligne" [-m "…"]
//   node scripts/changelog/monter.mjs --nouveaute --titre "…" -m "…"
//   node scripts/changelog/monter.mjs --refonte   --titre "…" -m "…"     (premier chiffre : sur décision de Matt)
//
// 1. src/lib/version.ts : VERSION et RELEASED ;
// 2. CHANGELOG.md : l'entrée « ## X.Y.Z · JJ/MM/AAAA · Titre » en tête, avec une puce par -m ;
// 3. generer.mjs : le journal engendré, package.json et public/version.json ;
// 4. un commit de ces seuls fichiers, « X.Y.Z · Titre », et l'étiquette vX.Y.Z.
//
// Le code de la livraison se commite AVANT, fichiers nommés un par un. --sans-commit s'arrête après
// l'étape 3 ; --co-auteur "Nom <adresse>" ajoute la ligne Co-Authored-By. L'envoi (git push) et la
// mise en ligne restent ceux de la recette /livrer de l'app.
//
// SITE SANS CONSTRUCTION (Station Météo, 20/11/2026) : un fichier `version.config.json` à la racine dit
// où vit le numéro et où il est recopié ; la commande est la même, et `--verifier` refuse un numéro
// qui n'est pas le même partout (c'est le contrôle que lance le site avant de publier).
//   { "source": "docs/js/config.js", "motif": "SM.VERSION = '{v}'",
//     "copies": [{ "fichier": "docs/index.html", "motifs": ["?v={v}"] }],
//     "publique": "docs/version.json" }
//
// COPIE DIFFUSÉE depuis ~/Developer/socle/outils/versions (node outils/diffuser.mjs) :
// ne jamais la modifier dans l'app.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const VERSION_TS = join(RACINE, "src", "lib", "version.ts");
const JOURNAL = join(RACINE, "CHANGELOG.md");
const args = process.argv.slice(2);
const valeurs = (nom) => args.flatMap((a, i) => (a === nom && args[i + 1] ? [args[i + 1]] : []));
const arreter = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};
const git = (...a) => execFileSync("git", a, { cwd: RACINE, encoding: "utf8" }).trim();

const NUMERO = "(\\d+\\.\\d+\\.\\d+)";
const enMotif = (motif) => new RegExp(motif.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\{v\\}", NUMERO), "g");
const suivante = (actuelle, genre) => {
  let [a, b, c] = actuelle.split(".").map(Number);
  if (genre === "--correctif") c += 1;
  else if (genre === "--nouveaute") [b, c] = [b + 1, 0];
  else [a, b, c] = [a + 1, 0, 0];
  return `${a}.${b}.${c}`;
};
const aujourdhui = () => {
  const j = new Date();
  const deux = (n) => String(n).padStart(2, "0");
  return {
    iso: `${j.getFullYear()}-${deux(j.getMonth() + 1)}-${deux(j.getDate())}`,
    fr: `${deux(j.getDate())}/${deux(j.getMonth() + 1)}/${j.getFullYear()}`,
  };
};
const ajouterAuJournal = (entree) => {
  const journal = readFileSync(JOURNAL, "utf8");
  const premiere = journal.search(/^## /m);
  writeFileSync(JOURNAL, premiere < 0 ? `${journal.trimEnd()}\n\n${entree}` : journal.slice(0, premiere) + entree + journal.slice(premiere));
};

// ── Site sans construction : tout est décrit par version.config.json ──────────────────────────
const CONFIG = join(RACINE, "version.config.json");
if (existsSync(CONFIG)) {
  const config = JSON.parse(readFileSync(CONFIG, "utf8"));
  const lire = (f) => readFileSync(join(RACINE, f), "utf8");
  const actuelle = enMotif(config.motif).exec(lire(config.source))?.[1];
  if (!actuelle) arreter(`${config.source} : numéro introuvable (motif ${config.motif}).`);
  const copies = [{ fichier: config.source, motifs: [config.motif] }, ...(config.copies ?? [])];

  if (args.includes("--verifier")) {
    const ecarts = [];
    for (const { fichier, motifs } of copies)
      for (const motif of motifs) {
        const vus = [...lire(fichier).matchAll(enMotif(motif))].map((m) => m[1]);
        if (!vus.length) ecarts.push(`${fichier} : aucun « ${motif} »`);
        else if (vus.some((v) => v !== actuelle)) ecarts.push(`${fichier} : « ${motif} » à une autre version que ${actuelle}`);
      }
    const tete = /^## (\d+\.\d+\.\d+)/m.exec(readFileSync(JOURNAL, "utf8"))?.[1];
    if (tete !== actuelle) ecarts.push(`CHANGELOG.md : l'entrée de tête est ${tete}, pas ${actuelle}`);
    if (config.publique) {
      let publique = null;
      try {
        publique = JSON.parse(lire(config.publique)).version;
      } catch {
        /* absent */
      }
      if (publique !== actuelle) ecarts.push(`${config.publique} : ${publique}, pas ${actuelle}`);
    }
    if (ecarts.length) {
      console.log(`VERSION · ERREUR · ${ecarts.join(" ; ")}. La version se monte par monter.mjs, jamais à la main.`);
      process.exit(1);
    }
    console.log(`VERSION · À JOUR · v${actuelle} partout`);
    process.exit(0);
  }

  const genres = ["--correctif", "--nouveaute", "--refonte"].filter((g) => args.includes(g));
  if (genres.length !== 1) arreter("Dire une seule fois --correctif, --nouveaute ou --refonte.");
  const puces = valeurs("-m");
  if (!puces.length) arreter('Il manque au moins un -m "Ce qui change".');
  const version = suivante(actuelle, genres[0]);
  const { iso, fr } = aujourdhui();
  for (const { fichier, motifs } of copies) {
    let texte = lire(fichier);
    for (const motif of motifs) texte = texte.split(motif.replace("{v}", actuelle)).join(motif.replace("{v}", version));
    writeFileSync(join(RACINE, fichier), texte);
  }
  const titreEntree = valeurs("--titre")[0];
  ajouterAuJournal(`## ${version} · ${fr}${titreEntree ? ` · ${titreEntree}` : ""}\n\n${puces.map((l) => `- ${l}`).join("\n")}\n\n`);
  if (config.publique) writeFileSync(join(RACINE, config.publique), JSON.stringify({ version, released: iso }) + "\n");
  console.log(`✓ version ${version} écrite partout (était ${actuelle}).${config.ensuite ? ` Ensuite : ${config.ensuite}` : ""}`);
  process.exit(0);
}

// ── Site construit (src/lib/version.ts) ───────────────────────────────────────────────────────
const genre = ["--correctif", "--nouveaute", "--refonte"].filter((g) => args.includes(g));
if (genre.length !== 1) arreter("Dire une seule fois --correctif, --nouveaute ou --refonte.");
const titre = valeurs("--titre")[0];
if (!titre) arreter('Il manque --titre "Rubrique · Ce qui change".');
const lignes = valeurs("-m");
if (!lignes.length) arreter('Il manque au moins un -m "Ce qui change".');

const source = readFileSync(VERSION_TS, "utf8");
const actuelle = source.match(/VERSION = "(\d+)\.(\d+)\.(\d+)"/);
if (!actuelle) arreter("src/lib/version.ts : VERSION introuvable.");
let [a, b, c] = actuelle.slice(1).map(Number);
if (genre[0] === "--correctif") c += 1;
else if (genre[0] === "--nouveaute") [b, c] = [b + 1, 0];
else [a, b, c] = [a + 1, 0, 0];
const version = `${a}.${b}.${c}`;
if (git("tag", "--list", `v${version}`)) arreter(`L'étiquette v${version} existe déjà.`);

const jour = new Date();
const deux = (n) => String(n).padStart(2, "0");
const iso = `${jour.getFullYear()}-${deux(jour.getMonth() + 1)}-${deux(jour.getDate())}`;
const fr = `${deux(jour.getDate())}/${deux(jour.getMonth() + 1)}/${jour.getFullYear()}`;

let neuf = source.replace(/VERSION = "[^"]+"/, `VERSION = "${version}"`);
if (/RELEASED = "[^"]+"/.test(neuf)) neuf = neuf.replace(/RELEASED = "[^"]+"/, `RELEASED = "${iso}"`);
writeFileSync(VERSION_TS, neuf);

const journal = readFileSync(JOURNAL, "utf8");
const entree = `## ${version} · ${fr} · ${titre}\n\n${lignes.map((l) => `- ${l}`).join("\n")}\n\n`;
const premiere = journal.search(/^## /m);
writeFileSync(JOURNAL, premiere < 0 ? `${journal.trimEnd()}\n\n${entree}` : journal.slice(0, premiere) + entree + journal.slice(premiere));

execFileSync(process.execPath, [join(RACINE, "scripts/changelog/generer.mjs")], { stdio: "inherit" });
execFileSync(process.execPath, [join(RACINE, "scripts/changelog/generer.mjs"), "--verifier"], { stdio: "inherit" });

const fichiers = ["src/lib/version.ts", "CHANGELOG.md", "src/lib/changelog.generated.json", "package.json", "public/version.json"]
  .filter((f) => existsSync(join(RACINE, f)));
if (args.includes("--sans-commit")) {
  console.log(`✓ version ${version} écrite, sans commit. À commiter : ${fichiers.join(", ")}`);
  process.exit(0);
}
const coAuteur = valeurs("--co-auteur")[0];
git("add", "--", ...fichiers);
git("commit", "-q", "-m", `${version} · ${titre}${coAuteur ? `\n\nCo-Authored-By: ${coAuteur}` : ""}`, "--", ...fichiers);
git("tag", `v${version}`);
console.log(`✓ version ${version} · commit ${git("rev-parse", "--short", "HEAD")} · étiquette v${version}`);
