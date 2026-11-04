#!/bin/bash
# Gera dist/public/styles/custom.css e copia os scripts a partir de src/.
# A versão é o resumo desses arquivos: vai dentro do custom.js e em
# orbita/versao.txt, que a página confere para saber se a sua cópia está velha.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$DIR/src/build.py" "$DIR/dist/public/styles/custom.css"
VERSAO="$(cat "$DIR/src/custom.js" "$DIR/src/orbita-files.js" "$DIR/src/orbita-touch.js" "$DIR/dist/public/styles/custom.css" | sha256sum | cut -c1-12)"
sed "s/@@VERSAO@@/$VERSAO/" "$DIR/src/custom.js" > "$DIR/dist/public/scripts/custom.js"
echo "$VERSAO" > "$DIR/dist/public/orbita/versao.txt"
cp "$DIR/src/orbita-files.js" "$DIR/dist/public/scripts/orbita-files.js"
cp "$DIR/src/orbita-touch.js" "$DIR/dist/public/scripts/orbita-touch.js"
node --check "$DIR/dist/public/scripts/custom.js" && node --check "$DIR/dist/public/scripts/orbita-files.js" && node --check "$DIR/dist/public/scripts/orbita-touch.js" && echo "scripts ok"
