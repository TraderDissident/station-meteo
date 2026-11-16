#!/bin/zsh
# Publie la version courante sur GitHub Pages après les contrôles.
# Avant : monter SM.VERSION (docs/js/config.js), les ?v= de docs/index.html et docs/sw.js, et CHANGELOG.md.
set -e
cd "${0:A:h}/.."
tools/check.sh
VERSION=$(sed -n "s/^SM.VERSION = '\(.*\)';/\1/p" docs/js/config.js)
git add -A
git commit -m "Station Météo $VERSION" || true
git push origin main
echo "Publié : $VERSION. GitHub Pages met une à deux minutes à se mettre à jour."
