#!/bin/zsh
# Contrôles bloquants : syntaxe et API de Safari 12, astronomie, codes météo, version.
cd "${0:A:h}"
[[ -d node_modules/acorn ]] || npm install --silent acorn@8
exec node check.js
