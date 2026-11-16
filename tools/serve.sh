#!/bin/zsh
# Sert l'app en local sur http://localhost:8765 pour les essais.
cd "${0:A:h}/../docs" && exec python3 -m http.server 8765 --bind 127.0.0.1
