#!/bin/bash
# Remove o tema Órbita e volta ao visual original do MeshCentral (sem reiniciar).
# Uso: ./remover.sh [nome-do-container]   (padrão: meshcentral)
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
C="${1:-meshcentral}"
WEB=/opt/meshcentral/meshcentral-web/public
cd "$DIR/dist/public"
for f in $(find . -type f | sed 's|^\./||'); do docker exec "$C" rm -f "$WEB/$f"; done
docker exec "$C" sh -c "rmdir '$WEB/orbita/fonts' '$WEB/orbita' 2>/dev/null || true"
echo "Tema removido. Recarregue a página no navegador para ver o visual original."
