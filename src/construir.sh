#!/bin/bash
# Gera dist/public/styles/custom.css e copia o custom.js a partir de src/.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$DIR/src/build.py" "$DIR/dist/public/styles/custom.css"
cp "$DIR/src/custom.js" "$DIR/dist/public/scripts/custom.js"
cp "$DIR/src/orbita-files.js" "$DIR/dist/public/scripts/orbita-files.js"
node --check "$DIR/dist/public/scripts/custom.js" && node --check "$DIR/dist/public/scripts/orbita-files.js" && echo "scripts ok"
